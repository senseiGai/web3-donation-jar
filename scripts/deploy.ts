import { ethers } from "hardhat";

async function main() {
  // Получаем контрактную фабрику
  const DonationJarFactory = await ethers.getContractFactory("DonationJar");

  // Деплоим контракт (ethers v6 возвращает контракт + tx)
  const donationJar = await DonationJarFactory.deploy();

  // Ждём, пока контракт задеплоится
  await donationJar.waitForDeployment();

  // Адрес контракта
  const address = await donationJar.getAddress();

  console.log(`DonationJar deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
