const TRU = artifacts.require('TRU.sol');
const ExchangeRateOracle = artifacts.require('./ExchangeRateOracle.sol');
const IncentiveLayer = artifacts.require('IncentiveLayer.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('DepositsManager', function(accounts) {
  let depositsManager, token, oracle;

    beforeEach(async () => {
        token = await TRU.new();
        oracle = await ExchangeRateOracle.new()
        depositsManager = await IncentiveLayer.new(token.address, oracle.address);
        // get some tokens and allow transfer
        await token.sendTransaction({from: accounts[1], value: web3.utils.toWei('1', 'ether')})
        await token.approve(depositsManager.address, 1000, {from: accounts[1]})
    })

    describe('makeDeposit', () => {
        it('should make a deposit', async () => {
            let tx

            tx = await depositsManager.makeDeposit(1000, {from: accounts[1]})
            log = tx.logs.find(log => log.event === 'DepositMade')
            assert.equal(log.args.who, accounts[1])
            assert(log.args.amount.eq(1000))

            const deposit = await depositsManager.getDeposit.call(accounts[1])
            assert(deposit.eq(1000))
        })
    })

    describe('withdrawDeposit', () => {
        it("should withdraw the desired amount from the account's deposit", async () => {
            let deposit

            // make a deposit
            await depositsManager.makeDeposit(1000, {from: accounts[1]})
            deposit = await depositsManager.getDeposit.call(accounts[1])
            assert(deposit.eq(1000))

            // withdraw part of the deposit
            const tx = await depositsManager.withdrawDeposit(500, {from: accounts[1]})
            log = tx.logs.find(log => log.event === 'DepositWithdrawn')
            assert.equal(log.args.who, accounts[1])
            assert(log.args.amount.eq(500))

            deposit = await depositsManager.getDeposit.call(accounts[1])
            assert(deposit.eq(500))
        });

        it("should throw an error if withdrawing more than existing deposit", async () => {
            let deposit;

            // make a deposit
            await depositsManager.makeDeposit(1000, {from: accounts[1]})
            deposit = await depositsManager.getDeposit.call(accounts[1])
            assert(deposit.eq(1000))

            // withdraw part of the deposit
            try {
              await depositsManager.withdrawDeposit(2000, {from: accounts[1]})
            } catch(error) {
              assert.match(error, /VM Exception [a-zA-Z0-9 ]+/);
            }

            // deposit should not have changed.
            deposit = await depositsManager.getDeposit.call(accounts[1])
            assert(deposit.eq(1000))
        })
    })
})
