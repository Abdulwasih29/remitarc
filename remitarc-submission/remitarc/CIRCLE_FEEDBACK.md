# Circle Product Feedback

## Why these products for RemitArc

**USDC on Arc**
Remittances live or die on predictability. Traditional wire transfers have variable fees and 1-3 day settlement windows. Arc's deterministic finality and dollar-denominated gas fees make it the right foundation for a consumer remittance product. Users know exactly what they pay and exactly when funds arrive.

**Circle Embedded Wallets**
The target user is a UAE-based expat who wants to send money home. This person is not a crypto native. Circle's embedded wallet removes the biggest UX barrier — seed phrases — and lets us present a product that feels like Wise or Remitly, not like a DeFi app. Custodial wallet abstraction was non-negotiable for this use case.

**CCTP with Bridge Kit**
Recipients are in India, the Philippines, Pakistan, Egypt, and other markets. Not all of them are on Arc. CCTP lets us mint USDC on the destination chain without wrapping or bridging risks. The burn-and-mint model is the cleanest cross-chain UX we could build around.

**Circle Gateway**
The back-office problem in remittances is treasury management: how does the operator maintain liquidity across corridors? Gateway handles that routing layer so we can focus on the user experience rather than running manual treasury operations.

---

## What worked well

**Arc testnet onboarding** was faster than expected. The RPC endpoint was stable, and having dollar-denominated fees removes a cognitive burden during development — no mental conversion from ETH to USD when estimating transaction costs.

**USDC contract on Arc** behaved exactly as expected. Standard ERC-20 with `approve + transferFrom` worked without any Arc-specific quirks, which meant our smart contract could be written against a clean interface.

**Circle sandbox API** has good coverage. The `/payouts` and `/transfers` endpoints gave us enough to simulate the full Gateway and CCTP relay flow in development before touching testnet.

**CCTP message attestation** is conceptually clean. The burn-and-mint model is easy to explain to a non-technical audience, which matters when writing documentation and product descriptions.

---

## What could be improved

**CCTP attestation polling** currently requires the backend to poll the Circle attestation API until the message is ready. A webhook or push notification when an attestation is available would simplify the backend considerably and reduce latency in the user-facing confirmation flow.

**Circle Wallets SDK documentation** could include more complete examples for the AED-to-USDC on-ramp flow. The embedded wallet creation and signing flows are well documented, but the path from a fiat deposit to a wallet USDC balance required piecing together multiple doc pages.

**Arc block explorer** does not yet surface contract events in a human-readable format. A verified contract ABI submission flow (similar to Etherscan's verify tool) would help developers debug and demonstrate their projects during the hackathon demo period.

**Gateway payout routing** to non-crypto recipients (bank account off-ramps) is listed as a capability but the sandbox coverage is limited. A test mode that simulates a bank off-ramp end-to-end without real banking partners would be valuable for hackathon projects targeting remittance corridors.

---

## Recommendations

1. Ship a remittance-specific quickstart guide covering the full stack: embedded wallet creation, USDC approval, on-chain settlement, CCTP relay, and Gateway payout — all in one walkthrough. Most remittance teams need all four pieces and currently have to assemble the docs themselves.

2. Add a CCTP webhook endpoint so backends can subscribe to attestation events rather than polling.

3. Provide a higher-fidelity Arc testnet faucet with configurable USDC amounts to support load testing.

4. Consider a "remittance corridor" concept in Circle Gateway — a pre-configured routing rule for a given source-destination country pair — so operators can define corridors in the dashboard rather than in code.
