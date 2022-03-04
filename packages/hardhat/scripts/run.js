async function main() {
  const [owner, somebodyElse] = await hre.ethers.getSigners();
  const propertyContractFactory = await hre.ethers.getContractFactory(
    "Property"
  );
  const propertyContract = await propertyContractFactory.deploy();
  await propertyContract.deployed();
  console.log("Contract deployed to:", propertyContract.address);

  let tx = await propertyContract.safeMint(owner.address, "metadata");
  await tx.wait();
  let book = await propertyContract.getBooking(1);
  console.log("before: ", book);
  console.log("allowed?: ", await propertyContract.bookingAllowed(1));
  tx = await propertyContract.toggleStatus(1);
  await tx.wait();
  book = await propertyContract.getBooking(1);
  console.log("allowed: ", book);
  await tx.wait();
  console.log("allowed?: ", await propertyContract.bookingAllowed(1));
  tx = await propertyContract.connect(somebodyElse).createBooking(1);
  await tx.wait();
  book = await propertyContract.getBooking(1);
  console.log("after: ", book);
  // error
  try {
    tx = await propertyContract.connect(somebodyElse).cancelBooking(1);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  // cancel
  tx = await propertyContract.cancelBooking(1);
  await tx.wait();
  book = await propertyContract.getBooking(1);
  console.log("cancel: ", book);
  // error
  try {
    tx = await propertyContract.connect(somebodyElse).reserveProperty(1);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  console.log("reserved?: ", await propertyContract.propertyReserved(1));
  tx = await propertyContract.reserveProperty(1);
  await tx.wait();
  book = await propertyContract.getBooking(1);
  console.log("reserve: ", book);
  console.log("reserved?: ", await propertyContract.propertyReserved(1));
  // cancel
  tx = await propertyContract.cancelBooking(1);
  await tx.wait();
  book = await propertyContract.getBooking(1);
  console.log("cancel: ", book);
  console.log("reserved?: ", await propertyContract.propertyReserved(1));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
