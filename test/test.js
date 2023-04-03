const { expect } = require("chai");

describe("Ptc", function(){
    this.beforeEach(async function(){
        [owner, test_wallet] = await ethers.getSigners();
        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        ptc = await Ptc.deploy();
    });

    describe("deployment", function () {
        it("should have correct name and symbol", async function () {
            expect(await ptc.name()).to.equal("PTC");
            expect(await ptc.symbol()).to.equal("PeTeCoin");
          });
          
        it("should mint tokens to test_wallet", async function () {
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(5000);
        });

        it("should mint any amount of ptc tokens to caller ", async function() {
            await ptc.connect(owner).mint(10000);
            expect(await ptc.balanceOf(owner.address)).to.equal(10000);
        });
    });
});

describe("Safe", function () {
    this.beforeEach(async function(){
        [owner, test_wallet] = await ethers.getSigners();
        Safe = await ethers.getContractFactory("Safe");
        safe = await Safe.deploy(owner.address);
    
        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        ptc = await Ptc.deploy();

        ptc.connect(test_wallet);
        await ptc.connect(test_wallet).approve(safe.address,5000);

        PTC = ptc.address;
        // Get a signer for the owner address
        ownerSigner = ethers.provider.getSigner(owner.address);
    });

    describe("deployment", function () {
        it("should deploy Safe contract with correct owner", async function() {
            expect(await safe.owner()).to.equal(owner.address);
        });

        it("should mint tokens to test_wallet", async function () {
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(5000);
        });
    });

    describe("takeFee", function() {
        it("should not allow non-owner to take fee", async function(){
            await expect(safe.connect(test_wallet).takeFee(PTC)).to.be.revertedWith("NOT owner!");
        });
        it("should allow owner take fee", async function () {
            await safe.connect(test_wallet).deposit(PTC, 1000);
            const feeBefore = await safe.fee(PTC); // Store the fee before calling `takeFee`
            await safe.connect(ownerSigner).takeFee(PTC);
            expect(await ptc.balanceOf(owner.address)).to.equal(feeBefore);//(safe.fee(PTC));
            expect(await safe.fee(PTC)).to.equal(0);
        });
    })

    describe("deposit", function () {
        it("if amount>=1000, should deposit 99.9% of ptc and take 0.1% as fee ", async function () {
            await safe.connect(test_wallet).deposit(PTC,2000);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(3000);
            expect(await safe._balances(test_wallet.address, PTC)).to.equal(1998);
            expect(await safe.fee(PTC)).to.equal(2);
        })        
        it("if amount<1000, should deposit (amount-1)ptc and take 1 ptc as fee ", async function () {
            await safe.connect(test_wallet).deposit(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safe._balances(test_wallet.address, PTC)).to.equal(499);
            expect(await safe.fee(PTC)).to.equal(1);
        })
    })

    describe("withdraw", function () {
        it("should withdraw ptc from the contract", async function () {
            await safe.connect(test_wallet).deposit(PTC,1000);
            await safe.connect(test_wallet).withdraw(PTC,500);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(4500);
            expect(await safe._balances(test_wallet.address, PTC)).to.equal(499);
        })

        it("should not allow withdrawing more than has been deposited", async function () {
            await expect(safe.connect(test_wallet).withdraw(PTC,5001)).to.be.revertedWith("Insufficent balance!")
        })
    })
});


describe("SafeFactory", function(){
    this.beforeEach(async function(){
        [owner, user, addr1] = await ethers.getSigners();
        SafeFactory = await ethers.getContractFactory("Safefactory");
        safefactory = await SafeFactory.deploy();
    
        // Get a signer for the owner address
        //ownerSigner = ethers.provider.getSigner(owner.address);
        //userSigner = ethers.provider.getSigner(user.address);
        //addr1Signer = ethers.provider.getSigner(addr1.address);
    });
    describe("deployment", function () {
        it("should deploy SafeFactory contract with correct owner", async function() {
            expect(await safefactory.owner()).to.equal(owner.address);
        });
    });

    describe("deploySafe", async function () {
        it("the owner of new Safe contract is the caller of deploySafe", async function() {
            await safefactory.connect(user).deploySafe();
            CURRENT_ADDRESS=await safefactory.current_address();
            const Safe = await ethers.getContractAt("Safe", CURRENT_ADDRESS);
            const Safe_owner = await Safe.owner();
            expect(Safe_owner==user.address);

            // this ain't right cuz when calling deploysafe, will also deploy a Safe contract instead of using factory
            // just a reminder for myself
            //await safefactory.connect(owner).deploySafe();
            //Safe = await ethers.getContractFactory("Safe");
            //safe = await Safe.deploy(owner.address);
            //expect(await safe.owner()).to.equal(owner.address);
            
        });
    });

    describe("deploySafeProxy", function () {
        it("the owner of new SafeProxy contract is the caller of deploySafeProxy", async function() {
            await safefactory.connect(user).deploySafeProxy();
            CURRENT_ADDRESS=await safefactory.current_address();
            PROXY_ADDRESS=await safefactory.proxy_address()
            const SafeProxy = await ethers.getContractAt("SafeProxy",PROXY_ADDRESS);
            const SafeProxy_owner = await SafeProxy.owner();
            expect(SafeProxy_owner==user.address);
        });
    })

    describe("updateImplementation", function () {
        it("should not allow non-owner to update implementation", async function(){
            await expect(safefactory.connect(user).updateImplementation(addr1.address)).to.be.revertedWith("NOT owner!");
        });
        it("should allow owner to update implementation", async function(){
            await safefactory.connect(owner).updateImplementation(addr1.address);
            expect(await safefactory.current_address()).to.equal(addr1.address);
        });
    })
})


describe("SafeUpgradeable", function () {
    this.beforeEach(async function(){
        [owner, user, test_wallet] = await ethers.getSigners();
        SafeUpgradeable = await ethers.getContractFactory("SafeUpgradeable");
        safeupgradeable = await SafeUpgradeable.deploy();  
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
        it("should initialize the owner", async function () {
            expect(await safeupgradeable.owner()).to.equal(owner.address);
        });
        it("should revert if already initialized", async function() {
            expect(await safeupgradeable.isInitialized==true).to.be.revertedWith("already initialized");
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
            await safeupgradeable.connect(owner).takeFee(PTC);
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

describe("SafeUpgradeable_v2", function () {
    this.beforeEach(async function(){
        [owner, user, test_wallet] = await ethers.getSigners();
        SafeUpgradeable_v2 = await ethers.getContractFactory("SafeUpgradeable_v2");
        safeupgradeable_v2 = await SafeUpgradeable_v2.deploy();  
        await safeupgradeable_v2.initialize(owner.address);

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
            expect(await safeupgradeable_v2.isInitialized==true).to.be.revertedWith("already initialized");
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
            await safeupgradeable_v2.connect(owner).takeFee(PTC);
            expect(await ptc.balanceOf(owner.address)).to.equal(feeBefore);
            expect(await safeupgradeable_v2.fee(PTC)).to.equal(0);
        });
    })

    describe("deposit", function () {
        it("if amount>=1000, should deposit 99.9% of ptc and take 0.1% as fee ", async function () {
            await safeupgradeable_v2.connect(test_wallet).deposit(PTC,2000);
            expect(await ptc.balanceOf(test_wallet.address)).to.equal(3000);
            expect(await safeupgradeable_v2._balances(test_wallet.address, PTC)).to.equal(1996);
            expect(await safeupgradeable_v2.fee(PTC)).to.equal(4);
        })        
        it("if amount<1000, should deposit (amount-1)ptc and take 1 ptc as fee ", async function () {
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
        await safeupgradeable.initialize(owner.address);

        SafeUpgradeable_v2 = await ethers.getContractFactory("SafeUpgradeable_v2");
        safeupgradeable_v2 = await SafeUpgradeable_v2.deploy();  
        await safeupgradeable_v2.initialize(owner.address);

        Ptc = await ethers.getContractFactory("Ptc", test_wallet);
        ptc = await Ptc.deploy();

        ptc.connect(test_wallet);
        await ptc.connect(test_wallet).approve(safeupgradeable.address,5000);

        PTC = ptc.address;

        SafeProxy = await ethers.getContractFactory("SafeProxy");
        safeproxy = await SafeProxy.deploy(owner.address,safeupgradeable.address);  
        await ptc.connect(test_wallet).approve(safeproxy.address,5000);

        // Get a signer for the owner address
        ownerSigner = ethers.provider.getSigner(owner.address);
    });

    describe("deployment", function () {
        it("should deploy SafeProxy contract with correct owner", async function() {
            expect(await safeproxy._getOwner()).to.equal(owner.address);
        });

        it("should point to an implement contract", async function() {
            expect(await safeproxy._getImplementation()).to.equal(safeupgradeable.address);
        });
    });

    describe("delegatecall", function(){
        it("proxy delegatecall to initialize implementaion", async function(){
            await safeproxy.setImplementation(safeupgradeable.address);
            const abi=["function initialize(address caller) public",
                       "function _getOwner() public view returns (address)"];
            const proxied = new ethers.Contract(safeproxy.address, abi, owner);
            await proxied.initialize(owner.address) 
            expect (await proxied._getOwner()).to.eq(owner.address);
        });
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
        it("non-Owner won't able to upgrade implementaion of proxy",async function(){
            await expect(safeproxy.connect(user).upgradeTo(newimp.address)).to.be.revertedWith("NOT owner!");
        });

        it("new implementation should be a contact",async function(){
            await expect(safeproxy.connect(owner).upgradeTo("0x0000000000000000000000000000000000000000")).to.be.revertedWith("implementation is not contract");
        });

        it("Owner should be able to upgrade implementaion of proxy",async function(){
            await safeproxy.connect(owner).upgradeTo(safeupgradeable_v2.address);
            expect(await safeproxy._getImplementation()).to.equal(safeupgradeable_v2.address);
        });

    });

});
