import math
from decimal import Decimal, getcontext
from typing import Any, Dict, List, Optional

from web3 import Web3

SECONDS_PER_YEAR = 365 * 24 * 3600
PRICE_DECIMALS = Decimal(10**8)
WAD = Decimal(10**18)

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

    def _to_decimal_from_float(self, value: Optional[float]) -> Optional[Decimal]:
        if value is None:
            return None
        return Decimal(str(value))

    def _format_usd(self, value: Optional[Decimal]) -> Optional[str]:
        if value is None:
            return None
        return str(value.quantize(Decimal("0.000001")))

    def _amount_to_usd(self, amount: Optional[int], decimals: Optional[int], price: Optional[int]):
        if amount is None or decimals is None or price is None:
            return None
        amount_dec = Decimal(amount) / (Decimal(10) ** decimals)
        price_dec = Decimal(price) / PRICE_DECIMALS
        return amount_dec * price_dec

    def _amount_to_usd_from_price_usd(
        self, amount: Optional[int], decimals: Optional[int], price_usd: Optional[float]
    ) -> Optional[Decimal]:
        if amount is None or decimals is None or price_usd is None:
            return None
        amount_dec = Decimal(amount) / (Decimal(10) ** decimals)
        price_dec = Decimal(str(price_usd))
        return amount_dec * price_dec

    def _price_to_usd(self, price: Optional[int]) -> Optional[Decimal]:
        if price is None:
            return None
        return Decimal(price) / PRICE_DECIMALS

    def _rate_to_decimal(self, rate: Optional[int]) -> Optional[Decimal]:
        if rate is None:
            return None
        return Decimal(rate) / WAD

    def _decimal_to_pct(self, value: Optional[Decimal]) -> Optional[Decimal]:
        if value is None:
            return None
        return value * Decimal(100)

    def _to_float(self, value: Optional[Decimal], quantize: Optional[str] = None) -> Optional[float]:
        if value is None:
            return None
        if quantize:
            value = value.quantize(Decimal(quantize))
        return float(value)

    def _amount_to_token(self, amount: Optional[int], decimals: Optional[int]) -> Optional[float]:
        if amount is None or decimals is None:
            return None
        return self._to_float(Decimal(amount) / (Decimal(10) ** decimals))

    def _wad_to_float(self, value: Optional[int], quantize: Optional[str] = None) -> Optional[float]:
        if value is None:
            return None
        return self._to_float(Decimal(value) / WAD, quantize)

    def _token_to_usd_from_price_usd(
        self, amount: Optional[float], price_usd: Optional[float]
    ) -> Optional[Decimal]:
        if amount is None or price_usd is None:
            return None
        return Decimal(str(amount)) * Decimal(str(price_usd))

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

            price_raw = self._get_price(underlying)
            price_usd = self._price_to_usd(price_raw)

            supply_underlying_raw = None
            supply_underlying = None
            supply_usd = None
            if total_supply is not None and exchange_rate is not None:
                supply_underlying_dec = (Decimal(total_supply) * Decimal(exchange_rate)) / WAD
                supply_underlying_raw = int(supply_underlying_dec)
                if decimals is not None:
                    supply_underlying = self._to_float(
                        supply_underlying_dec / (Decimal(10) ** decimals)
                    )
                supply_usd = self._amount_to_usd(supply_underlying_raw, decimals, price_raw)

            borrow_underlying = None
            borrow_usd = self._amount_to_usd(total_borrows, decimals, price_raw)
            if total_borrows is not None and decimals is not None:
                borrow_underlying = self._to_float(
                    Decimal(total_borrows) / (Decimal(10) ** decimals)
                )

            supply_rate_dec = self._rate_to_decimal(supply_rate_year)
            borrow_rate_dec = self._rate_to_decimal(borrow_rate_year)
            collateral_factor_dec = self._wad_to_float(collateral_factor, "0.0000000000000001")

            results.append(
                {
                    "market": market.address,
                    "underlying": underlying,
                    "symbol": symbol,
                    "decimals": decimals,
                    "totalSupply": supply_underlying,
                    "totalSupplyUnderlying": supply_underlying,
                    "totalSupplyUsd": self._to_float(supply_usd, "0.000001"),
                    "totalBorrows": borrow_underlying,
                    "totalBorrowsUnderlying": borrow_underlying,
                    "totalBorrowsUsd": self._to_float(borrow_usd, "0.000001"),
                    "totalReserves": self._amount_to_token(total_reserves, decimals),
                    "cash": self._amount_to_token(cash, decimals),
                    "exchangeRate": self._wad_to_float(exchange_rate, "0.000000000000000001"),
                    "utilization": utilization,
                    "borrowRatePerYear": self._to_float(borrow_rate_dec, "0.0000000000000001"),
                    "borrowAprPct": self._to_float(self._decimal_to_pct(borrow_rate_dec), "0.0001"),
                    "supplyRatePerYear": self._to_float(supply_rate_dec, "0.0000000000000001"),
                    "supplyAprPct": self._to_float(self._decimal_to_pct(supply_rate_dec), "0.0001"),
                    "price": self._to_float(price_usd, "0.000001"),
                    "priceUsd": self._to_float(price_usd, "0.000001"),
                    "collateralFactor": collateral_factor_dec,
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
            collateral_factor = market.get("collateralFactor") or 0
            supply_rate = market.get("supplyRatePerYear") or 0

            supply_usd = self._to_decimal_from_float(
                market.get("totalSupplyUsd", market.get("totalSupply"))
            )
            borrow_usd = self._to_decimal_from_float(
                market.get("totalBorrowsUsd", market.get("totalBorrows"))
            )

            if supply_usd is not None:
                total_supply += supply_usd
                total_collateral += supply_usd * Decimal(str(collateral_factor))
                total_earning += supply_usd * Decimal(str(supply_rate))
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
        collateral_total = Decimal(0)
        weighted_supply_rate = Decimal(0)
        weighted_borrow_rate = Decimal(0)

        for pos in positions:
            price_usd = pos.get("priceUsd", pos.get("price"))
            supply_underlying = pos.get("supplyUnderlying")
            borrow_balance = pos.get("borrowBalance")
            supply_rate = pos.get("supplyRatePerYear") or 0
            borrow_rate = pos.get("borrowRatePerYear") or 0
            cf = pos.get("collateralFactor") or 0

            supply_usd = self._token_to_usd_from_price_usd(supply_underlying, price_usd)
            borrow_usd = self._token_to_usd_from_price_usd(borrow_balance, price_usd)

            if supply_usd is not None:
                supply_total += supply_usd
                collateral_total += supply_usd * Decimal(str(cf))
                weighted_supply_rate += supply_usd * Decimal(str(supply_rate))
            if borrow_usd is not None:
                borrow_total += borrow_usd
                weighted_borrow_rate += borrow_usd * Decimal(str(borrow_rate))

        net_supply_apr = (
            weighted_supply_rate / supply_total if supply_total > 0 else Decimal(0)
        )
        net_borrow_apr = (
            weighted_borrow_rate / borrow_total if borrow_total > 0 else Decimal(0)
        )

        liquidity_usd = data.get("liquidityUsd", data.get("liquidity"))
        shortfall_usd = data.get("shortfallUsd", data.get("shortfall"))
        liquidity_dec = self._to_decimal_from_float(liquidity_usd)
        shortfall_dec = self._to_decimal_from_float(shortfall_usd)

        borrow_capacity = self._format_usd(liquidity_dec) if liquidity_dec is not None else None
        liquidation_point = self._format_usd(shortfall_dec) if shortfall_dec is not None else None

        available_to_borrow = None
        if liquidity_dec is not None and borrow_total is not None:
            available_to_borrow = self._format_usd(liquidity_dec)

        health_factor = None
        if borrow_total > 0:
            health_factor = float(collateral_total / borrow_total)

        return {
            "account": data.get("account"),
            "netSupplyAPR": float(net_supply_apr),
            "netBorrowAPR": float(net_borrow_apr),
            "healthFactor": health_factor,
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
            dtoken_decimals = self._call_fn(market, "decimals")

            supply_dtoken_raw = self._call_fn(market, "balanceOf", checksum)
            borrow_balance_raw = self._call_fn(market, "borrowBalanceStored", checksum)
            exchange_rate = self._call_fn(market, "exchangeRateStored")
            underlying_supply_raw = None
            if supply_dtoken_raw is not None and exchange_rate is not None:
                underlying_supply_raw = (supply_dtoken_raw * exchange_rate) // 10**18

            supply_dtoken = self._amount_to_token(supply_dtoken_raw, dtoken_decimals)
            underlying_supply = self._amount_to_token(underlying_supply_raw, decimals)
            borrow_balance = self._amount_to_token(borrow_balance_raw, decimals)

            collateral_factor = None
            is_listed = None
            if self.comptroller:
                cfg = self._call_fn(self.comptroller, "getMarketConfiguration", market.address)
                if cfg:
                    collateral_factor, is_listed = cfg

            price_raw = self._get_price(underlying)
            price_usd = self._price_to_usd(price_raw)
            supply_rate_raw = self._call_fn(
                self._get_rate_model(self._call_fn(market, "interestRateModel")),
                "getSupplyRatePerYear",
                self._call_fn(market, "getCash"),
                self._call_fn(market, "totalBorrows"),
                self._call_fn(market, "totalReserves", default=0),
                self._call_fn(market, "reserveFactorMantissa", default=0),
            )
            borrow_rate_raw = self._call_fn(
                self._get_rate_model(self._call_fn(market, "interestRateModel")),
                "getBorrowRatePerYear",
                self._call_fn(market, "getCash"),
                self._call_fn(market, "totalBorrows"),
                self._call_fn(market, "totalReserves", default=0),
            )
            positions.append(
                {
                    "market": market.address,
                    "underlying": underlying,
                    "symbol": symbol,
                    "decimals": decimals,
                    "dTokenDecimals": dtoken_decimals,
                    "supplyDToken": supply_dtoken,
                    "supplyUnderlying": underlying_supply,
                    "borrowBalance": borrow_balance,
                    "exchangeRate": self._wad_to_float(exchange_rate, "0.000000000000000001"),
                    "price": self._to_float(price_usd, "0.000001"),
                    "priceUsd": self._to_float(price_usd, "0.000001"),
                    "supplyRatePerYear": self._to_float(
                        self._rate_to_decimal(supply_rate_raw), "0.0000000000000001"
                    ),
                    "borrowRatePerYear": self._to_float(
                        self._rate_to_decimal(borrow_rate_raw), "0.0000000000000001"
                    ),
                    "collateralFactor": self._wad_to_float(collateral_factor, "0.0000000000000001"),
                    "isListed": is_listed,
                }
            )

        total_collateral_usd = Decimal(0)
        total_borrow_usd = Decimal(0)
        for pos in positions:
            price_usd = pos.get("priceUsd", pos.get("price"))
            cf = pos.get("collateralFactor") or 0
            supply_usd = self._token_to_usd_from_price_usd(pos.get("supplyUnderlying"), price_usd)
            borrow_usd = self._token_to_usd_from_price_usd(pos.get("borrowBalance"), price_usd)
            if supply_usd is not None:
                total_collateral_usd += supply_usd * Decimal(str(cf))
            if borrow_usd is not None:
                total_borrow_usd += borrow_usd

        health_factor = None
        if total_borrow_usd > 0:
            health_factor = float(total_collateral_usd / total_borrow_usd)

        liquidity_usd = (
            self._to_float(Decimal(liquidity) / PRICE_DECIMALS, "0.000001")
            if liquidity is not None
            else None
        )
        shortfall_usd = (
            self._to_float(Decimal(shortfall) / PRICE_DECIMALS, "0.000001")
            if shortfall is not None
            else None
        )

        return {
            "account": checksum,
            "liquidity": liquidity_usd,
            "liquidityUsd": liquidity_usd,
            "shortfall": shortfall_usd,
            "shortfallUsd": shortfall_usd,
            "isHealthy": shortfall == 0 if shortfall is not None else None,
            "healthFactor": health_factor,
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
        dtoken_decimals = self._call_fn(market, "decimals")

        supply_dtoken_raw = self._call_fn(market, "balanceOf", checksum)
        borrow_balance_raw = self._call_fn(market, "borrowBalanceStored", checksum)
        exchange_rate = self._call_fn(market, "exchangeRateStored")
        underlying_supply_raw = None
        if supply_dtoken_raw is not None and exchange_rate is not None:
            underlying_supply_raw = (supply_dtoken_raw * exchange_rate) // 10**18

        collateral_factor = None
        is_listed = None
        if self.comptroller:
            cfg = self._call_fn(self.comptroller, "getMarketConfiguration", market.address)
            if cfg:
                collateral_factor, is_listed = cfg

        price_raw = self._get_price(underlying)
        price_usd = self._price_to_usd(price_raw)

        return {
            "account": checksum,
            "market": market.address,
            "underlying": underlying,
            "symbol": symbol,
            "decimals": decimals,
            "dTokenDecimals": dtoken_decimals,
            "supplyDToken": self._amount_to_token(supply_dtoken_raw, dtoken_decimals),
            "supplyUnderlying": self._amount_to_token(underlying_supply_raw, decimals),
            "borrowBalance": self._amount_to_token(borrow_balance_raw, decimals),
            "exchangeRate": self._wad_to_float(exchange_rate, "0.000000000000000001"),
            "price": self._to_float(price_usd, "0.000001"),
            "priceUsd": self._to_float(price_usd, "0.000001"),
            "collateralFactor": self._wad_to_float(collateral_factor, "0.0000000000000001"),
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
            balance_raw = self._call_fn(erc20, "balanceOf", checksum) if erc20 else None
            price_raw = self._get_price(addr)
            balances.append(
                {
                    "symbol": symbol,
                    "underlying": addr,
                    "decimals": decimals,
                    "balance": self._amount_to_token(balance_raw, decimals),
                    "price": self._to_float(self._price_to_usd(price_raw), "0.000001"),
                    "priceUsd": self._to_float(self._price_to_usd(price_raw), "0.000001"),
                }
            )

        return {"account": checksum, "balances": balances}

    def get_contract_addresses(self) -> Dict[str, Any]:
        markets: List[Dict[str, Any]] = []
        for market in self.markets:
            underlying = self._call_fn(market, "underlying")
            underlying_checksum = self._checksum(underlying) or underlying
            underlying_erc20 = self._get_erc20(underlying_checksum)
            markets.append(
                {
                    "market": market.address,
                    "underlying": underlying_checksum,
                    "symbol": self._call_fn(underlying_erc20, "symbol") if underlying_erc20 else None,
                    "decimals": self._call_fn(underlying_erc20, "decimals") if underlying_erc20 else None,
                }
            )

        liquidity_mining: List[Dict[str, Any]] = []
        reward_tokens: Dict[str, Dict[str, Any]] = {}
        for mining in self.liquidity_mining:
            staking_token = self._call_fn(mining, "stakingToken")
            rewards_token = self._call_fn(mining, "rewardsToken")
            staking_checksum = self._checksum(staking_token) or staking_token
            rewards_checksum = self._checksum(rewards_token) or rewards_token

            staking_erc20 = self._get_erc20(staking_checksum)
            rewards_erc20 = self._get_erc20(rewards_checksum)

            liquidity_mining.append(
                {
                    "mining": mining.address,
                    "stakingToken": staking_checksum,
                    "stakingSymbol": self._call_fn(staking_erc20, "symbol") if staking_erc20 else None,
                    "rewardsToken": rewards_checksum,
                    "rewardsSymbol": self._call_fn(rewards_erc20, "symbol") if rewards_erc20 else None,
                }
            )

            if rewards_checksum:
                key = rewards_checksum.lower()
                if key not in reward_tokens:
                    reward_tokens[key] = {
                        "token": rewards_checksum,
                        "symbol": self._call_fn(rewards_erc20, "symbol") if rewards_erc20 else None,
                        "decimals": self._call_fn(rewards_erc20, "decimals") if rewards_erc20 else None,
                    }

        return {
            "chainId": self.w3.eth.chain_id,
            "comptroller": self.comptroller.address if self.comptroller else None,
            "priceOracle": self.price_oracle.address if self.price_oracle else None,
            "markets": [item["market"] for item in markets],
            "liquidityMining": [item["mining"] for item in liquidity_mining],
            "marketDetails": markets,
            "liquidityMiningDetails": liquidity_mining,
            "rewardTokens": list(reward_tokens.values()),
        }

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
                    "rewardRate": self._amount_to_token(reward_rate, rewards_decimals),
                    "totalStaked": self._amount_to_token(total_staked, staking_decimals),
                    "rewardPerToken": self._wad_to_float(
                        self._call_fn(mining, "rewardPerToken"), "0.000000000000000001"
                    ),
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
                    "stakedBalance": self._amount_to_token(
                        self._call_fn(mining, "balanceOf", checksum),
                        staking_decimals,
                    ),
                    "earned": self._amount_to_token(
                        self._call_fn(mining, "earned", checksum),
                        rewards_decimals,
                    ),
                    "stakingTokenPrice": 1.0,
                    "rewardsTokenPrice": 1.0,
                    "apr": apr,
                    "apy": apy,
                }
            )

        gov_balance = None
        gov_symbol = None
        gov_decimals = None
        gov_token = None
        if results:
            gov_token = results[0].get("rewardsToken")
            gov_symbol = results[0].get("rewardsSymbol")
            gov_decimals = results[0].get("rewardsDecimals")
        if gov_token:
            gov_erc20 = self._get_erc20(gov_token)
            raw_balance = self._call_fn(gov_erc20, "balanceOf", checksum) if gov_erc20 else None
            gov_balance = self._amount_to_token(raw_balance, gov_decimals)

        return {
            "account": checksum,
            "govToken": gov_token,
            "govSymbol": gov_symbol,
            "govDecimals": gov_decimals,
            "govBalance": gov_balance,
            "positions": results,
        }
