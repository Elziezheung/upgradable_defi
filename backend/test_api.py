import json
import sys
import urllib.parse
import urllib.request


BASE_URL = "http://127.0.0.1:8000"


def get(path, params=None):
    url = BASE_URL + path
    if params:
        query = urllib.parse.urlencode(params)
        url = f"{url}?{query}"
    with urllib.request.urlopen(url) as resp:
        data = resp.read().decode("utf-8")
        return json.loads(data)


def main():
    account = sys.argv[1] if len(sys.argv) > 1 else "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

    print("GET /health")
    print(json.dumps(get("/health"), indent=2))

    print("\nGET /markets")
    markets = get("/markets")
    print(json.dumps(markets, indent=2))

    print("\nGET /markets/summary")
    print(json.dumps(get("/markets/summary"), indent=2))

    print(f"\nGET /accounts/{account}")
    print(json.dumps(get(f"/accounts/{account}"), indent=2))

    print("\nGET /account/overview")
    print(json.dumps(get("/account/overview", {"account": account}), indent=2))

    print("\nGET /account/wallet")
    print(json.dumps(get("/account/wallet", {"account": account, "assets": "USDC"}), indent=2))

    print("\nGET /events")
    print(json.dumps(get("/events", {"limit": 5}), indent=2))

    print("\nGET /stats")
    print(json.dumps(get("/stats"), indent=2))

    print("\nGET /events/amounts")
    print(json.dumps(get("/events/amounts", {"account": account}), indent=2))

    print("\nGET /liquidity-mining")
    print(json.dumps(get("/liquidity-mining"), indent=2))

    print(f"\nGET /liquidity-mining/{account}")
    print(json.dumps(get(f"/liquidity-mining/{account}"), indent=2))


if __name__ == "__main__":
    main()
