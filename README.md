# loanos30-frontend

### Install
```bash
yarn install
```

### Test
First, build program.
```bash
yarn build
```
Second, get correct `programId`
```bash
solana address -k ./target/deploy/fig_loan-keypair.json
```
Third, replace `programsId`s in `/Anchor.toml` and `/programs/fig-loan/src/lib.rs` with above one.

Finally, run test. (you can skip above steps once you did them.)

```bash
yarn test
```

### Migrate
```bash
yarn migrate
```

## Environment Variables
