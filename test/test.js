const { expect } = require("chai");

describe("Safe", function () {
    this.beforeEach(async function(){

        // Get the owner and test_wallet signers
        [owner, test_wallet] = await ethers.getSigners();

        // Get the Safe contract factory
        Safe = await ethers.getContractFactory("Safe");
        // Deploy an instance of the Safe contract with the owner address as the constructor argument
        safe = await Safe.deploy(owner.address);
        
        // Get the Ptc contract factory, passing in the test_wallet as the initial owner
        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        // Deploy an instance of the Ptc contract
        ptc = await Ptc.deploy();

        // Connect the test_wallet to the Ptc contract
        ptc.connect(test_wallet);
        // Approve the Safe contract to spend 5000 Ptc tokens from the test_wallet
        await ptc.connect(test_wallet).approve(safe.address,5000);

        // Store the Ptc contract address in a variable
        PTC = ptc.address;
        // Get a signer for the owner address
        ownerSigner = ethers.provider.getSigner(owner.address);
    });

    describe("deployment", function () {
        // ensure that the Safe contract is deployed with the correct owner
        it("should deploy Safe contract with correct owner", async function() {
            expect(await safe.owner()).to.equal(owner.address);
        });

        // ensure that tokens are minted to the test_wallet
        it("should mint tokens to test_wallet", async function () {
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(5000);
        });
    });

    describe("takeFee", function() {
        // ensure that non-owner cannot take the fee
        it("should not allow non-owner to take fee", async function(){
            await expect(safe.connect(test_wallet).takeFee(PTC)).to.be.revertedWith("NOT owner!");
        });

        // ensure that owner can take the fee and that the correct amount is transferred
        it("should allow owner take fee", async function () {
            // Deposit some PTC into the Safe contract
            await safe.connect(test_wallet).deposit(PTC, 1000);
            const feeBefore = await safe.fee(PTC); // Store the fee before calling `takeFee`

            // Call `takeFee` to transfer the fee to the owner's address
            await safe.connect(ownerSigner).takeFee(PTC);

            // check if the correct amount of PTC has been transferred to the owner's address and that the fee has been reset to 0
            expect(await ptc.balanceOf(owner.address)).to.equal(feeBefore);//(safe.fee(PTC));
            expect(await safe.fee(PTC)).to.equal(0);
        });
    })

    describe("deposit", function () {
        // ensure that if amount >= 1000, 99.9% of PTC is deposited and 0.1% is taken as fee
        it("if amount>=1000, should deposit 99.9% of ptc and take 0.1% as fee ", async function () {
            // Deposit some PTC into the Safe contract
            await safe.connect(test_wallet).deposit(PTC,2000);

            // check if the correct amount of PTC has been deposited and that the correct amount of fee has been taken
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(3000);
            expect(await safe._balances(test_wallet.address, PTC)).to.equal(1998);
            expect(await safe.fee(PTC)).to.equal(2);
        })        

        // ensure that if amount < 1000, (amount-1) PTC is deposited and 1 PTC is taken as fee
        it("if amount<1000, should deposit (amount-1)ptc and take 1 ptc as fee ", async function () {
            // Deposit some PTC into the Safe contract
            await safe.connect(test_wallet).deposit(PTC,500);

            // check if that the correct amount of PTC has been deposited and that the correct amount of fee has been taken
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safe._balances(test_wallet.address, PTC)).to.equal(499);
            expect(await safe.fee(PTC)).to.equal(1);
        })
    })


    describe("withdraw", function () {
        // Verify that a user can withdraw PTC from the contract
        it("should withdraw ptc from the contract", async function () {
            await safe.connect(test_wallet).deposit(PTC,1000);
            await safe.connect(test_wallet).withdraw(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safe._balances(test_wallet.address, PTC)).to.equal(499);
        })

        // Verify that a user cannot withdraw more PTC than they have deposited
        it("should not allow withdrawing more than has been deposited", async function () {
            await expect(safe.connect(test_wallet).withdraw(PTC,5001)).to.be.revertedWith("Insufficent balance!")
        })
    })
});


describe("SafeFactory", function(){
    this.beforeEach(async function(){
        // Get the owner, user and newImp signers
        [owner, user, newImp] = await ethers.getSigners();
        
        // Get the SafeFactory contract factory
        SafeFactory = await ethers.getContractFactory("Safefactory");

        // Deploy an instance of the SafeFactory contract with the owner address as the constructor argument
        safefactory = await SafeFactory.deploy();
    });

    // Check if the SafeFactory contract is deployed with the correct owner
    describe("deployment", function () {
        it("should deploy SafeFactory contract with correct owner", async function() {
            expect(await safefactory.owner()).to.equal(owner.address);
        });
    });

    describe("deploySafe", async function () {
        it("the owner of new Safe contract is the caller of deploySafe", async function() {
            // Call the deploySafe function using the user account
            await safefactory.connect(user).deploySafe();

            // Get the address of the newly deployed Safe contract
            SAFE_ADDRESS=await safefactory.safe_address();

            // Get the instance of the Safe contract using its address
            const Safe = await ethers.getContractAt("Safe", SAFE_ADDRESS);

            // Get the owner of the newly deployed Safe contract
            const Safe_owner = await Safe.owner();

            // Check if the owner of the new Safe contract is the caller of deploySafe
            expect(Safe_owner==user.address);

            // this ain't right cuz when calling deploysafe, will also deploy a Safe contract instead of using factory
            // just a reminder for myself
            //await safefactory.connect(owner).deploySafe();
            //Safe = await ethers.getContractFactory("Safe");
            //safe = await Safe.deploy(owner.address);
            //expect(await safe.owner()).to.equal(owner.address);
            
        });
    });

    // as sama as deploySafe
    describe("deploySafeProxy", function () {
        it("the owner of new SafeProxy contract is the caller of deploySafeProxy", async function() {
            await safefactory.connect(user).deploySafeProxy();
            SAFE_ADDRESS=await safefactory.safe_address();
            PROXY_ADDRESS=await safefactory.proxy_address()
            const SafeProxy = await ethers.getContractAt("SafeProxy",PROXY_ADDRESS);
            const SafeProxy_owner = await SafeProxy.owner();
            expect(SafeProxy_owner==user.address);
        });
    })

    describe("updateImplementation", function () {
        // Call updateImplementation function from user account and expect it to revert
        it("should not allow non-owner to update implementation", async function(){
            await expect(safefactory.connect(user).updateImplementation(safe.address)).to.be.revertedWith("NOT owner!");
        });

        it("should allow owner to update implementation", async function(){
            // Call updateImplementation function from owner account to update the implementation of SafeFactory contract
            await safefactory.connect(owner).updateImplementation(safe.address);

            // Verify that the implementation has been updated
            expect(await safefactory.safe_address()).to.equal(safe.address);
        });
    })
})

//this is almost as same as Safe, only constructor has changed to initialize
describe("SafeUpgradeable", function () {
    this.beforeEach(async function(){
        [owner, user, test_wallet] = await ethers.getSigners();
        SafeUpgradeable = await ethers.getContractFactory("SafeUpgradeable");
        safeupgradeable = await SafeUpgradeable.deploy();
        // initialize the safeupgradeable here
        await safeupgradeable.connect(owner).initialize(owner.address);

        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        ptc = await Ptc.deploy();

        ptc.connect(test_wallet);
        await ptc.connect(test_wallet).approve(safeupgradeable.address,5000);

        PTC = ptc.address;
        // Get a signer for the owner address
        ownerSigner = ethers.provider.getSigner(owner.address);
    });

    describe("deployment & initialize", function() {
        // check if this contract is initialize with the correct owner.
        it("should initialize the owner", async function () {
            expect(await safeupgradeable.owner()).to.equal(owner.address);
        });

        // ensure that this contact can't be initialize twice.
        it("should revert if already initialized", async function() {
            expect(safeupgradeable.initialize(owner.address)).to.be.revertedWith("already initialized");
        });

        it("should mint tokens to test_wallet", async function () {
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(5000);
        });
    });

    describe("takeFee", function() {
        it("should not allow non-owner to take fee", async function(){
          await expect(safeupgradeable.connect(test_wallet).takeFee(PTC)).to.be.revertedWith("NOT owner!");
        });
        it("should allow owner take fee", async function () {
            await safeupgradeable.connect(test_wallet).deposit(PTC, 1000);
            const feeBefore = await safeupgradeable.fee(PTC); // Store the fee before calling `takeFee`
            await safeupgradeable.connect(ownerSigner).takeFee(PTC);
            expect(await ptc.balanceOf(owner.address)).to.equal(feeBefore);
            expect(await safeupgradeable.fee(PTC)).to.equal(0);
        });
    })

    describe("deposit", function () {
        it("if amount>=1000, should deposit 99.9% of ptc and take 0.1% as fee ", async function () {
            await safeupgradeable.connect(test_wallet).deposit(PTC,2000);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(3000);  
            expect(await safeupgradeable._balances(test_wallet.address, PTC)).to.equal(1998);
            expect(await safeupgradeable.fee(PTC)).to.equal(2);
        })
        it("if amount<1000, should deposit (amount-1)ptc and take 1 ptc as fee ", async function () {
            await safeupgradeable.connect(test_wallet).deposit(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safeupgradeable._balances(test_wallet.address, PTC)).to.equal(499);
            expect(await safeupgradeable.fee(PTC)).to.equal(1);
        })
    })

    describe("withdraw", function () {
        it("should withdraw ptc from the contract", async function () {
            await safeupgradeable.connect(test_wallet).deposit(PTC,1000);
            await safeupgradeable.connect(test_wallet).withdraw(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safeupgradeable._balances(test_wallet.address, PTC)).to.equal(499);
        })

        it("should not allow withdrawing more than has been deposited", async function () {
            await expect(safeupgradeable.connect(test_wallet).withdraw(PTC,5001)).to.be.revertedWith("Insufficent balance!")
        })
    })
});

//this is alomost as same as SafeUpgradeable, only takeFee part has change to 0.2%
describe("SafeUpgradeable_v2", function () {
    this.beforeEach(async function(){
        [owner, user, test_wallet] = await ethers.getSigners();
        SafeUpgradeable_v2 = await ethers.getContractFactory("SafeUpgradeable_v2");
        safeupgradeable_v2 = await SafeUpgradeable_v2.deploy();  
        await safeupgradeable_v2.connect(owner).initialize(owner.address);

        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        ptc = await Ptc.deploy();

        ptc.connect(test_wallet);
        await ptc.connect(test_wallet).approve(safeupgradeable_v2.address,5000);

        PTC = ptc.address;
        // Get a signer for the owner address
        ownerSigner = ethers.provider.getSigner(owner.address);
    });

    describe("deployment & initialize", function() {
        it("should initialize the owner", async function () {
            expect(await safeupgradeable_v2.owner()).to.equal(owner.address);
        });
        it("should revert if already initialized", async function() {
            expect(safeupgradeable_v2.initialize(owner.address)).to.be.revertedWith("already initialized");
        });
        it("should mint tokens to test_wallet", async function () {
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(5000);
        });
    });

    describe("takeFee", function() {
        it("should not allow non-owner to take fee", async function(){
          await expect(safeupgradeable_v2.connect(test_wallet).takeFee(PTC)).to.be.revertedWith("NOT owner!");
        });
        it("should allow owner take fee", async function () {
            await safeupgradeable_v2.connect(test_wallet).deposit(PTC, 1000);
            const feeBefore = await safeupgradeable_v2.fee(PTC); // Store the fee before calling `takeFee`
            await safeupgradeable_v2.connect(ownerSigner).takeFee(PTC);
            expect(await ptc.balanceOf(owner.address)).to.equal(feeBefore);
            expect(await safeupgradeable_v2.fee(PTC)).to.equal(0);
        });
    })

    describe("deposit", function () {
        it("if amount>=1000, should deposit 99.8% of ptc and take 0.2% as fee ", async function () {
            await safeupgradeable_v2.connect(test_wallet).deposit(PTC,2000);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(3000);
            expect(await safeupgradeable_v2._balances(test_wallet.address, PTC)).to.equal(1996);
            expect(await safeupgradeable_v2.fee(PTC)).to.equal(4);
        })        
        it("if amount<1000, should deposit (amount-2)ptc and take 2 ptc as fee ", async function () {
            await safeupgradeable_v2.connect(test_wallet).deposit(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safeupgradeable_v2._balances(test_wallet.address, PTC)).to.equal(498);
            expect(await safeupgradeable_v2.fee(PTC)).to.equal(2);
        })
    })

    describe("withdraw", function () {
        it("should withdraw ptc from the contract", async function () {
            await safeupgradeable_v2.connect(test_wallet).deposit(PTC,1000);
            await safeupgradeable_v2.connect(test_wallet).withdraw(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safeupgradeable_v2._balances(test_wallet.address, PTC)).to.equal(498);
        })

        it("should not allow withdrawing more than has been deposited", async function () {
            await expect(safeupgradeable_v2.connect(test_wallet).withdraw(PTC,5001)).to.be.revertedWith("Insufficent balance!")
        })
    })
});

describe("SafeProxy", function () {
    this.beforeEach(async function(){
        [owner, user, test_wallet, newimp] = await ethers.getSigners();
        SafeUpgradeable = await ethers.getContractFactory("SafeUpgradeable");
        safeupgradeable = await SafeUpgradeable.deploy();  
        await safeupgradeable.connect(owner).initialize(owner.address);

        SafeUpgradeable_v2 = await ethers.getContractFactory("SafeUpgradeable_v2");
        safeupgradeable_v2 = await SafeUpgradeable_v2.deploy();  
        await safeupgradeable_v2.connect(owner).initialize(owner.address);

        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        ptc = await Ptc.deploy();

        ptc.connect(test_wallet);
        await ptc.connect(test_wallet).approve(safeupgradeable.address,5000);

        PTC = ptc.address;

        SafeProxy = await ethers.getContractFactory("SafeProxy");
        safeproxy = await SafeProxy.deploy(owner.address,safeupgradeable.address);  
        await ptc.connect(test_wallet).approve(safeproxy.address,5000);
    });

    describe("deployment", function () {
        it("should deploy SafeProxy contract with correct owner", async function() {
            expect(await safeproxy._getOwner()).to.equal(owner.address);
        });

        it("should point to an implement contract", async function() {
            expect(await safeproxy._getImplementation()).to.equal(safeupgradeable.address);
        });
    });

    // test delegate call
    describe("delegatecall", function(){
        // check if delegate call can initialize the implemetation, the current implementation is safeupgradeable
        it("proxy delegatecall to initialize implementaion", async function(){
            await safeproxy.setImplementation(safeupgradeable.address);

            // Set ABI for SafeProxy and SafeUpgradeable contracts
            const abi=["function initialize(address caller) public",
                       "function _getOwner() public view returns (address)"];

            // Create a proxied contract with SafeProxy address and abi
            const proxied = new ethers.Contract(safeproxy.address, abi, owner);
            // Call initialize function on proxied contract
            await proxied.initialize(owner.address) 
            // ensure the proxied owner is the caller
            expect (await proxied._getOwner()).to.eq(owner.address);
        });

        // check if delegate call function in the implemetation works, here I test deposit and check _balances
        // it's worth mentioned that mapping isn't able to set as ABI
        // so I change mapping _balaances into a function
        it("proxy delegatecall to deposit", async function(){
            await safeproxy.setImplementation(safeupgradeable.address);
            const abi=["function initialize(address caller) public",
                       "function _getOwner() public view returns (address)",
                       "function _getImplementation() public view returns (address)",
                       "function deposit(address token, uint256 amount) public",
                       "function _balances(address,address) public view returns (uint256)"];
            const proxied = new ethers.Contract(safeproxy.address, abi, owner);
            ptc.connect(test_wallet);
            await ptc.connect(test_wallet).approve(proxied.address,5000);
            await proxied.connect(test_wallet).deposit(PTC,1000);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4000);
            expect(await proxied.connect(test_wallet)._balances(test_wallet.address, PTC)).to.equal(999);
        });
    });


    describe("update",function(){
        // ensure non-owner cannot upgrade the implementation of the proxy.
        it("non-Owner won't able to upgrade implementaion of proxy",async function(){
            await expect(safeproxy.connect(user).upgradeTo(newimp.address)).to.be.revertedWith("NOT owner!");
        });

        // ensure the new implementation must be a contract address.
        it("new implementation should be a contact",async function(){
            //use a 0 address to test
            await expect(safeproxy.connect(owner).upgradeTo("0x0000000000000000000000000000000000000000")).to.be.revertedWith("implementation is not contract");
        });

        // ensure the owner can successfully upgrade the implementation of the proxy.
        it("Owner should be able to upgrade implementaion of proxy",async function(){
            await safeproxy.connect(owner).upgradeTo(safeupgradeable_v2.address);
            expect(await safeproxy._getImplementation()).to.equal(safeupgradeable_v2.address);
        });

    });

});
