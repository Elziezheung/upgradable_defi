from typing import Any, Dict, List, Optional

from web3 import Web3

from .abi import load_abi
from .config import RPC_URL, load_addresses


class ChainReader:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        addresses = load_addresses()

        self.comptroller_address = addresses.get("comptroller")
        self.market_addresses = addresses.get("markets", [])
        self.price_oracle_address = addresses.get("priceOracle")

        self.comptroller_abi = load_abi("Comptroller")
        self.market_abi = load_abi("LendingToken")
        self.erc20_abi = load_abi("ERC20")
        self.price_oracle_abi = load_abi("PriceOracle")
        self.rate_model_abi = load_abi("JumpRateModel")

        self.comptroller = self._build_contract(self.comptroller_address, self.comptroller_abi)
        self.price_oracle = self._build_contract(self.price_oracle_address, self.price_oracle_abi)
        self.markets = self._build_market_contracts(self.market_addresses)

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
