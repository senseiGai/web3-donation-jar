import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { DonationJar } from "../typechain-types";

describe("DonationJar", () => {
  let donationJar: DonationJar;
  let owner: any, user1: any, user2: any;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const DonationJarFactory = await ethers.getContractFactory("DonationJar");
    donationJar = (await DonationJarFactory.deploy()) as unknown as DonationJar;
    await donationJar.waitForDeployment();
  });

  it("should store and emit donation correctly", async () => {
    const message = "Support your work!";
    const amount = parseEther("0.05");

    await expect(
      donationJar
        .connect(user1)
        .addDonate(user2.address, message, { value: amount })
    )
      .to.emit(donationJar, "Donated")
      .withArgs(user1.address, user2.address, amount, message, anyValue);

    const received = await donationJar.connect(user2).getReceivedDonations();
    expect(received.length).to.equal(1);
    expect(received[0].donator).to.equal(user1.address);
    expect(received[0].recipient).to.equal(user2.address);
    expect(received[0].amount).to.equal(amount);
    expect(received[0].message).to.equal(message);
  });

  it("should return received donations correctly", async () => {
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "1", { value: parseEther("0.01") });
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "2", { value: parseEther("0.02") });

    const received = await donationJar.connect(user2).getReceivedDonations();
    expect(received.length).to.equal(2);
    expect(received[0].message).to.equal("1");
    expect(received[1].message).to.equal("2");
  });

  it("should return my sent donations correctly", async () => {
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "a", { value: parseEther("0.01") });
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "b", { value: parseEther("0.02") });

    const myDonates = await donationJar.connect(user1).getMyDonates();
    expect(myDonates.length).to.equal(2);
    expect(myDonates[0].message).to.equal("a");
    expect(myDonates[1].message).to.equal("b");
  });

  it("should assign correct ranks based on total donation", async () => {
    // None (0 ETH)
    expect(await donationJar.getRank(user1.address)).to.equal(0);

    // Supporter (0.01 ETH)
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "support", { value: parseEther("0.01") });
    expect(await donationJar.getRank(user1.address)).to.equal(1);

    // Donator (0.1 ETH)
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "donator", { value: parseEther("0.09") });
    expect(await donationJar.getRank(user1.address)).to.equal(2);

    // Patron (1 ETH)
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "patron", { value: parseEther("0.9") });
    expect(await donationJar.getRank(user1.address)).to.equal(3);

    // Whale (5 ETH)
    await donationJar
      .connect(user1)
      .addDonate(user2.address, "whale", { value: parseEther("4") });
    expect(await donationJar.getRank(user1.address)).to.equal(4);
  });

  it("should revert if donation amount is below minimum", async () => {
    await expect(
      donationJar
        .connect(user1)
        .addDonate(user2.address, "fail", { value: parseEther("0.0005") })
    ).to.be.revertedWith("Minimum donation is 0.01 ETH");
  });

  it("should revert if recipient is zero address", async () => {
    await expect(
      donationJar
        .connect(user1)
        .addDonate(ethers.ZeroAddress, "fail", { value: parseEther("1") })
    ).to.be.revertedWith("Recipient cannot be zero address");
  });
});
