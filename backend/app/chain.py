import math
from decimal import Decimal, getcontext
from typing import Any, Dict, List, Optional

from web3 import Web3

SECONDS_PER_YEAR = 365 * 24 * 3600

from .abi import load_abi
from .config import RPC_URL, load_addresses


class ChainReader:
    def __init__(self):
        getcontext().prec = 50
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        addresses = load_addresses()

        self.comptroller_address = addresses.get("comptroller")
        self.market_addresses = addresses.get("markets", [])
        self.price_oracle_address = addresses.get("priceOracle")
        self.liquidity_mining_addresses = addresses.get("liquidityMining", [])

        self.comptroller_abi = load_abi("Comptroller")
        self.market_abi = load_abi("LendingToken")
        self.erc20_abi = load_abi("ERC20")
        self.price_oracle_abi = load_abi("PriceOracle")
        self.rate_model_abi = load_abi("JumpRateModel")
        self.liquidity_mining_abi = load_abi("LiquidityMining")

        self.comptroller = self._build_contract(self.comptroller_address, self.comptroller_abi)
        self.price_oracle = self._build_contract(self.price_oracle_address, self.price_oracle_abi)
        self.markets = self._build_market_contracts(self.market_addresses)
        self.liquidity_mining = self._build_liquidity_mining_contracts(
            self.liquidity_mining_addresses
        )

    def _checksum(self, address: Optional[str]) -> Optional[str]:
        if not address:
            return None
        if not self.w3.is_address(address):
            return None
        return self.w3.to_checksum_address(address)

    def _build_contract(self, address: Optional[str], abi) -> Optional[Any]:
        checksum = self._checksum(address)
        if not checksum:
            return None
        return self.w3.eth.contract(address=checksum, abi=abi)

    def _build_market_contracts(self, addresses: List[str]) -> List[Any]:
        contracts = []
        for addr in addresses:
            contract = self._build_contract(addr, self.market_abi)
            if contract:
                contracts.append(contract)
        return contracts

    def _build_liquidity_mining_contracts(self, addresses: List[str]) -> List[Any]:
        contracts = []
        for addr in addresses:
            contract = self._build_contract(addr, self.liquidity_mining_abi)
            if contract:
                contracts.append(contract)
        return contracts

    def _safe_call(self, func, default=None):
        try:
            return func.call()
        except Exception:
            return default

    def _call_fn(self, contract, name: str, *args, default=None):
        if not contract:
            return default
        try:
            fn = getattr(contract.functions, name)
        except Exception:
            return default
        return self._safe_call(fn(*args), default=default)

    def _get_erc20(self, address: Optional[str]) -> Optional[Any]:
        if not address:
            return None
        return self._build_contract(address, self.erc20_abi)

    def _get_rate_model(self, address: Optional[str]) -> Optional[Any]:
        if not address:
            return None
        return self._build_contract(address, self.rate_model_abi)

    def _get_price(self, asset: Optional[str]) -> Optional[int]:
        if not self.price_oracle or not asset:
            return None
        return self._call_fn(self.price_oracle, "getAssetPrice", asset)

    def _to_decimal(self, value: Optional[int]) -> Optional[Decimal]:
        if value is None:
            return None
        return Decimal(value)

    def _format_usd(self, value: Optional[Decimal]) -> Optional[str]:
        if value is None:
            return None
        return str(value.quantize(Decimal("0.000001")))

    def _amount_to_usd(self, amount: Optional[int], decimals: Optional[int], price: Optional[int]):
        if amount is None or decimals is None or price is None:
            return None
        amount_dec = Decimal(amount) / (Decimal(10) ** decimals)
        price_dec = Decimal(price) / Decimal(10**8)
        return amount_dec * price_dec

    def get_markets(self) -> List[Dict[str, Any]]:
        results = []
        for market in self.markets:
            underlying = self._call_fn(market, "underlying")
            erc20 = self._get_erc20(underlying)
            symbol = self._call_fn(erc20, "symbol") if erc20 else None
            decimals = self._call_fn(erc20, "decimals") if erc20 else None

            total_supply = self._call_fn(market, "totalSupply")
            total_borrows = self._call_fn(market, "totalBorrows")
            total_reserves = self._call_fn(market, "totalReserves", default=0)
            cash = self._call_fn(market, "getCash")
            exchange_rate = self._call_fn(market, "exchangeRateStored")

            interest_rate_model = self._call_fn(market, "interestRateModel")
            reserve_factor = self._call_fn(market, "reserveFactorMantissa", default=0)
            rate_model = self._get_rate_model(interest_rate_model)

            borrow_rate_year = None
            supply_rate_year = None
            if rate_model and cash is not None and total_borrows is not None:
                borrow_rate_year = self._call_fn(
                    rate_model,
                    "getBorrowRatePerYear",
                    cash,
                    total_borrows,
                    total_reserves,
                )
                supply_rate_year = self._call_fn(
                    rate_model,
                    "getSupplyRatePerYear",
                    cash,
                    total_borrows,
                    total_reserves,
                    reserve_factor,
                )
                if borrow_rate_year is None:
                    rate_per_second = self._call_fn(
                        rate_model, "getBorrowRate", cash, total_borrows, total_reserves
                    )
                    seconds = self._call_fn(rate_model, "SECONDS_PER_YEAR", default=31_536_000)
                    if rate_per_second is not None:
                        borrow_rate_year = rate_per_second * seconds
                if supply_rate_year is None:
                    rate_per_second = self._call_fn(
                        rate_model,
                        "getSupplyRate",
                        cash,
                        total_borrows,
                        total_reserves,
                        reserve_factor,
                    )
                    seconds = self._call_fn(rate_model, "SECONDS_PER_YEAR", default=31_536_000)
                    if rate_per_second is not None:
                        supply_rate_year = rate_per_second * seconds

            utilization = None
            if cash is not None and total_borrows is not None:
                denom = cash + total_borrows - (total_reserves or 0)
                if denom > 0:
                    utilization = float(total_borrows) / float(denom)

            collateral_factor = None
            is_listed = None
            if self.comptroller:
                cfg = self._call_fn(self.comptroller, "getMarketConfiguration", market.address)
                if cfg:
                    collateral_factor, is_listed = cfg

            results.append(
                {
                    "market": market.address,
                    "underlying": underlying,
                    "symbol": symbol,
                    "decimals": decimals,
                    "totalSupply": total_supply,
                    "totalBorrows": total_borrows,
                    "totalReserves": total_reserves,
                    "cash": cash,
                    "exchangeRate": exchange_rate,
                    "utilization": utilization,
                    "borrowRatePerYear": borrow_rate_year,
                    "supplyRatePerYear": supply_rate_year,
                    "price": self._get_price(underlying),
                    "collateralFactor": collateral_factor,
                    "isListed": is_listed,
                }
            )
        return results

    def get_markets_summary(self) -> Dict[str, Any]:
        markets = self.get_markets()
        total_supply = Decimal(0)
        total_borrow = Decimal(0)
        total_collateral = Decimal(0)
        total_earning = Decimal(0)

        for market in markets:
            decimals = market.get("decimals")
            price = market.get("price")
            exchange_rate = market.get("exchangeRate")
            supply_dtoken = market.get("totalSupply")
            borrow = market.get("totalBorrows")
            collateral_factor = market.get("collateralFactor") or 0
            supply_rate = market.get("supplyRatePerYear") or 0

            supply_underlying = None
            if supply_dtoken is not None and exchange_rate is not None:
                supply_underlying = (Decimal(supply_dtoken) * Decimal(exchange_rate)) / Decimal(
                    10**18
                )

            supply_usd = (
                self._amount_to_usd(int(supply_underlying), decimals, price)
                if supply_underlying is not None
                else None
            )
            borrow_usd = self._amount_to_usd(borrow, decimals, price)

            if supply_usd is not None:
                total_supply += supply_usd
                total_collateral += supply_usd * Decimal(collateral_factor) / Decimal(10**18)
                total_earning += supply_usd * Decimal(supply_rate) / Decimal(10**18)
            if borrow_usd is not None:
                total_borrow += borrow_usd

        return {
            "totalSupplyUsd": self._format_usd(total_supply),
            "totalEarningUsd": self._format_usd(total_earning),
            "totalBorrowUsd": self._format_usd(total_borrow),
            "totalCollateralUsd": self._format_usd(total_collateral),
        }

    def get_account_overview(self, account: str) -> Dict[str, Any]:
        data = self.get_account(account)
        positions = data.get("positions", [])

        supply_total = Decimal(0)
        borrow_total = Decimal(0)
        weighted_supply_rate = Decimal(0)
        weighted_borrow_rate = Decimal(0)

        for pos in positions:
            decimals = pos.get("decimals")
            price = pos.get("price")
            supply_underlying = pos.get("supplyUnderlying")
            borrow_balance = pos.get("borrowBalance")
            supply_rate = pos.get("supplyRatePerYear") or 0
            borrow_rate = pos.get("borrowRatePerYear") or 0

            supply_usd = self._amount_to_usd(supply_underlying, decimals, price)
            borrow_usd = self._amount_to_usd(borrow_balance, decimals, price)

            if supply_usd is not None:
                supply_total += supply_usd
                weighted_supply_rate += supply_usd * Decimal(supply_rate)
            if borrow_usd is not None:
                borrow_total += borrow_usd
                weighted_borrow_rate += borrow_usd * Decimal(borrow_rate)

        net_supply_apr = (
            weighted_supply_rate / supply_total / Decimal(10**18) if supply_total > 0 else Decimal(0)
        )
        net_borrow_apr = (
            weighted_borrow_rate / borrow_total / Decimal(10**18) if borrow_total > 0 else Decimal(0)
        )

        liquidity = data.get("liquidity")
        shortfall = data.get("shortfall")
        liquidity_dec = Decimal(liquidity) / Decimal(10**18) if liquidity is not None else None
        shortfall_dec = Decimal(shortfall) / Decimal(10**18) if shortfall is not None else None

        borrow_capacity = self._format_usd(liquidity_dec) if liquidity_dec is not None else None
        liquidation_point = self._format_usd(shortfall_dec) if shortfall_dec is not None else None

        available_to_borrow = None
        if liquidity_dec is not None and borrow_total is not None:
            available_to_borrow = self._format_usd(liquidity_dec)

        return {
            "account": data.get("account"),
            "netSupplyAPR": float(net_supply_apr),
            "netBorrowAPR": float(net_borrow_apr),
            "collateralValueUsd": self._format_usd(supply_total),
            "liquidationPointUsd": liquidation_point,
            "borrowCapacityUsd": borrow_capacity,
            "availableToBorrowUsd": available_to_borrow,
        }

    def get_account(self, account: str) -> Dict[str, Any]:
        checksum = self._checksum(account)
        if not checksum:
            raise ValueError("Invalid address")

        liquidity = None
        shortfall = None
        if self.comptroller:
            result = self._call_fn(self.comptroller, "getAccountLiquidity", checksum)
            if result:
                liquidity, shortfall = result

        positions = []
        for market in self.markets:
            underlying = self._call_fn(market, "underlying")
            erc20 = self._get_erc20(underlying)
            symbol = self._call_fn(erc20, "symbol") if erc20 else None
            decimals = self._call_fn(erc20, "decimals") if erc20 else None

            supply_dtoken = self._call_fn(market, "balanceOf", checksum)
            borrow_balance = self._call_fn(market, "borrowBalanceStored", checksum)
            exchange_rate = self._call_fn(market, "exchangeRateStored")
            underlying_supply = None
            if supply_dtoken is not None and exchange_rate is not None:
                underlying_supply = (supply_dtoken * exchange_rate) // 10**18

            collateral_factor = None
            is_listed = None
            if self.comptroller:
                cfg = self._call_fn(self.comptroller, "getMarketConfiguration", market.address)
                if cfg:
                    collateral_factor, is_listed = cfg

            positions.append(
                {
                    "market": market.address,
                    "underlying": underlying,
                    "symbol": symbol,
                    "decimals": decimals,
                    "supplyDToken": supply_dtoken,
                    "supplyUnderlying": underlying_supply,
                    "borrowBalance": borrow_balance,
                    "exchangeRate": exchange_rate,
                    "price": self._get_price(underlying),
                    "supplyRatePerYear": self._call_fn(
                        self._get_rate_model(self._call_fn(market, "interestRateModel")),
                        "getSupplyRatePerYear",
                        self._call_fn(market, "getCash"),
                        self._call_fn(market, "totalBorrows"),
                        self._call_fn(market, "totalReserves", default=0),
                        self._call_fn(market, "reserveFactorMantissa", default=0),
                    ),
                    "borrowRatePerYear": self._call_fn(
                        self._get_rate_model(self._call_fn(market, "interestRateModel")),
                        "getBorrowRatePerYear",
                        self._call_fn(market, "getCash"),
                        self._call_fn(market, "totalBorrows"),
                        self._call_fn(market, "totalReserves", default=0),
                    ),
                    "collateralFactor": collateral_factor,
                    "isListed": is_listed,
                }
            )

        return {
            "account": checksum,
            "liquidity": liquidity,
            "shortfall": shortfall,
            "isHealthy": shortfall == 0 if shortfall is not None else None,
            "positions": positions,
        }

    def get_account_market(self, account: str, market_address: str) -> Dict[str, Any]:
        checksum = self._checksum(account)
        if not checksum:
            raise ValueError("Invalid address")

        market = None
        for item in self.markets:
            if item.address.lower() == market_address.lower():
                market = item
                break
        if not market:
            market = self._build_contract(market_address, self.market_abi)
        if not market:
            raise ValueError("Invalid market")

        underlying = self._call_fn(market, "underlying")
        erc20 = self._get_erc20(underlying)
        symbol = self._call_fn(erc20, "symbol") if erc20 else None
        decimals = self._call_fn(erc20, "decimals") if erc20 else None

        supply_dtoken = self._call_fn(market, "balanceOf", checksum)
        borrow_balance = self._call_fn(market, "borrowBalanceStored", checksum)
        exchange_rate = self._call_fn(market, "exchangeRateStored")
        underlying_supply = None
        if supply_dtoken is not None and exchange_rate is not None:
            underlying_supply = (supply_dtoken * exchange_rate) // 10**18

        collateral_factor = None
        is_listed = None
        if self.comptroller:
            cfg = self._call_fn(self.comptroller, "getMarketConfiguration", market.address)
            if cfg:
                collateral_factor, is_listed = cfg

        return {
            "account": checksum,
            "market": market.address,
            "underlying": underlying,
            "symbol": symbol,
            "decimals": decimals,
            "supplyDToken": supply_dtoken,
            "supplyUnderlying": underlying_supply,
            "borrowBalance": borrow_balance,
            "exchangeRate": exchange_rate,
            "price": self._get_price(underlying),
            "collateralFactor": collateral_factor,
            "isListed": is_listed,
        }

    def get_wallet_balances(self, account: str, assets: Optional[List[str]] = None) -> Dict[str, Any]:
        checksum = self._checksum(account)
        if not checksum:
            raise ValueError("Invalid address")

        asset_map = {}
        for market in self.markets:
            underlying = self._call_fn(market, "underlying")
            erc20 = self._get_erc20(underlying)
            symbol = self._call_fn(erc20, "symbol") if erc20 else None
            if symbol:
                asset_map[symbol.upper()] = underlying

        selected = []
        if assets:
            for asset in assets:
                key = asset.upper()
                if key in asset_map:
                    selected.append((key, asset_map[key]))
                elif self.w3.is_address(asset):
                    selected.append((asset, asset))
        else:
            for sym, addr in asset_map.items():
                selected.append((sym, addr))

        balances = []
        for sym, addr in selected:
            erc20 = self._get_erc20(addr)
            symbol = self._call_fn(erc20, "symbol") if erc20 else sym
            decimals = self._call_fn(erc20, "decimals") if erc20 else None
            balance = self._call_fn(erc20, "balanceOf", checksum) if erc20 else None
            balances.append(
                {
                    "symbol": symbol,
                    "underlying": addr,
                    "decimals": decimals,
                    "balance": balance,
                    "price": self._get_price(addr),
                }
            )

        return {"account": checksum, "balances": balances}

    def get_liquidity_mining(self) -> List[Dict[str, Any]]:
        results = []
        for mining in self.liquidity_mining:
            staking_token = self._call_fn(mining, "stakingToken")
            rewards_token = self._call_fn(mining, "rewardsToken")
            staking_erc20 = self._get_erc20(staking_token)
            rewards_erc20 = self._get_erc20(rewards_token)

            staking_decimals = self._call_fn(staking_erc20, "decimals") if staking_erc20 else None
            rewards_decimals = self._call_fn(rewards_erc20, "decimals") if rewards_erc20 else None
            reward_rate = self._call_fn(mining, "rewardRate")
            total_staked = self._call_fn(mining, "totalSupply")

            apr = None
            apy = None
            if (
                reward_rate is not None
                and total_staked is not None
                and total_staked > 0
                and rewards_decimals is not None
                and staking_decimals is not None
            ):
                rewards_per_year = Decimal(reward_rate) * SECONDS_PER_YEAR / Decimal(10**rewards_decimals)
                staked_value = Decimal(total_staked) / Decimal(10**staking_decimals)
                apr = float(rewards_per_year / staked_value)
                apy = math.exp(apr) - 1

            results.append(
                {
                    "mining": mining.address,
                    "stakingToken": staking_token,
                    "stakingSymbol": self._call_fn(staking_erc20, "symbol") if staking_erc20 else None,
                    "stakingDecimals": staking_decimals,
                    "rewardsToken": rewards_token,
                    "rewardsSymbol": self._call_fn(rewards_erc20, "symbol") if rewards_erc20 else None,
                    "rewardsDecimals": rewards_decimals,
                    "rewardRate": reward_rate,
                    "totalStaked": total_staked,
                    "rewardPerToken": self._call_fn(mining, "rewardPerToken"),
                    "rewardsDuration": self._call_fn(mining, "rewardsDuration"),
                    "periodFinish": self._call_fn(mining, "periodFinish"),
                    "lastTimeRewardApplicable": self._call_fn(mining, "lastTimeRewardApplicable"),
                    "stakingTokenPrice": 1.0,
                    "rewardsTokenPrice": 1.0,
                    "apr": apr,
                    "apy": apy,
                }
            )
        return results

    def get_liquidity_mining_account(self, account: str) -> Dict[str, Any]:
        checksum = self._checksum(account)
        if not checksum:
            raise ValueError("Invalid address")

        results = []
        for mining in self.liquidity_mining:
            staking_token = self._call_fn(mining, "stakingToken")
            rewards_token = self._call_fn(mining, "rewardsToken")
            staking_erc20 = self._get_erc20(staking_token)
            rewards_erc20 = self._get_erc20(rewards_token)

            staking_decimals = self._call_fn(staking_erc20, "decimals") if staking_erc20 else None
            rewards_decimals = self._call_fn(rewards_erc20, "decimals") if rewards_erc20 else None
            reward_rate = self._call_fn(mining, "rewardRate")
            total_staked = self._call_fn(mining, "totalSupply")

            apr = None
            apy = None
            if (
                reward_rate is not None
                and total_staked is not None
                and total_staked > 0
                and rewards_decimals is not None
                and staking_decimals is not None
            ):
                rewards_per_year = Decimal(reward_rate) * SECONDS_PER_YEAR / Decimal(10**rewards_decimals)
                staked_value = Decimal(total_staked) / Decimal(10**staking_decimals)
                apr = float(rewards_per_year / staked_value)
                apy = math.exp(apr) - 1

            results.append(
                {
                    "mining": mining.address,
                    "stakingToken": staking_token,
                    "stakingSymbol": self._call_fn(staking_erc20, "symbol") if staking_erc20 else None,
                    "stakingDecimals": staking_decimals,
                    "rewardsToken": rewards_token,
                    "rewardsSymbol": self._call_fn(rewards_erc20, "symbol") if rewards_erc20 else None,
                    "rewardsDecimals": rewards_decimals,
                    "stakedBalance": self._call_fn(mining, "balanceOf", checksum),
                    "earned": self._call_fn(mining, "earned", checksum),
                    "stakingTokenPrice": 1.0,
                    "rewardsTokenPrice": 1.0,
                    "apr": apr,
                    "apy": apy,
                }
            )

        return {"account": checksum, "positions": results}
