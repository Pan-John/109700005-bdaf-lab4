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
The result should be like this( I didn't test token.sol ):

<img width="620" alt="截圖 2023-04-04 下午11 19 33" src="https://user-images.githubusercontent.com/125814787/229839633-7e416f06-558f-4e4b-80b3-60109daea19e.png">

The Uncovered Lines at SafeProxy.sol is `recieve() external payable { _fallback(); }`, I really don't know how to test that function.

If I commented the recieve() function, the result should be like this:

<img width="623" alt="截圖 2023-04-04 下午7 13 35" src="https://user-images.githubusercontent.com/125814787/229775017-a41079a9-e971-49ff-b065-5b5dcb1d0714.png">

## gas report
use [hardhat-gas-reporter](https://www.npmjs.com/package/hardhat-gas-reporter) to get gas report
```
npx hardhat test
```
edit .env

<img width="407" alt=".env" src="https://user-images.githubusercontent.com/125814787/226537657-bcd1c3b2-82ae-4af3-87ad-28e8c56155a9.png">

add `REPORT_GAS = true` into .env

The result should be like this:

<img width="859" alt="截圖 2023-04-04 下午7 24 24" src="https://user-images.githubusercontent.com/125814787/229777093-894ac090-9e0b-4ef4-bfbe-8b5db2b306d5.png">
