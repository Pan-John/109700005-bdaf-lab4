# 109700005-bdaf-lab4

## installation
with `npm` installed, run
```
npm install
```

## test coverage 
Use [solidity-coverage](https://www.npmjs.com/package/solidity-coverage) to check test coverage

```
npx hardhat coverage --testfiles "test/test.js" 
```
The result should be like this:

<img width="620" alt="截圖 2023-04-04 下午10 12 18" src="https://user-images.githubusercontent.com/125814787/229820329-b563a04f-aa65-4ea7-976c-917309971e64.png">

The Uncovered Lines at SafeProxy.sol is `recieve() external payable { _fallback(); }`, I really don't know how to test that function.

If I commented the recieve() function, the result should be like this:

<img width="623" alt="截圖 2023-04-04 下午7 13 35" src="https://user-images.githubusercontent.com/125814787/229775017-a41079a9-e971-49ff-b065-5b5dcb1d0714.png">

## gas report
use [hardhat-gas-reporter](https://www.npmjs.com/package/hardhat-gas-reporter) to get gas report
```
npx hardhat test
```
add `REPORT_GAS = true` into .env

The result should be like this:

<img width="859" alt="截圖 2023-04-04 下午7 24 24" src="https://user-images.githubusercontent.com/125814787/229777093-894ac090-9e0b-4ef4-bfbe-8b5db2b306d5.png">
