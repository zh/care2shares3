async function main() {
  const [owner, somebodyElse] = await hre.ethers.getSigners();
  const propertyContractFactory = await hre.ethers.getContractFactory(
    "Property"
  );
  const propertyContract = await propertyContractFactory.deploy();
  await propertyContract.deployed();
  console.log("Contract deployed to:", propertyContract.address);

  console.log("---[ START ]---");
  let tx = await propertyContract.safeMint(owner.address, "metadata");
  await tx.wait();
  let book = await propertyContract.getBooking(1);
  console.log("before: ", book);
  console.log("before allowed?: ", await propertyContract.bookingAllowed(1));
  const timeNow = (new Date().getTime() / 1000).toFixed();
  tx = await propertyContract
    .connect(somebodyElse)
    .createBooking(1, timeNow + 7 * 24 * 3600, timeNow + 8 * 24 * 3600);
  await tx.wait();
  console.log("after allowed?: ", await propertyContract.bookingAllowed(1));
  book = await propertyContract.getBooking(1);
  console.log("after: ", book);
  // already booked
  try {
    console.log("***[!] already booked error");
    tx = await propertyContract
      .connect(somebodyElse)
      .createBooking(1, timeNow, timeNow + 100);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  // not-owner error
  try {
    console.log("***[!] cancel wrong owner error");
    tx = await propertyContract.cancelBooking(1);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  // cancel
  tx = await propertyContract.connect(somebodyElse).cancelBooking(1);
  await tx.wait();
  book = await propertyContract.getBooking(1);
  console.log("cancel: ", book);

  // start in less than a week
  tx = await propertyContract
    .connect(somebodyElse)
    .createBooking(1, timeNow, timeNow + 24 * 3600);
  await tx.wait();
  try {
    console.log("***[!] cancel period over");
    // cancel error
    tx = await propertyContract.cancelBooking(1);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  // property owner functions
  try {
    console.log("***[!] reserve wrong owner error");
    tx = await propertyContract
      .connect(somebodyElse)
      .reserveProperty(1, timeNow, timeNow + 100);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  try {
    console.log("***[!] already reserved error");
    tx = await propertyContract.reserveProperty(1, timeNow, timeNow + 100);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  try {
    console.log("***[!] reject wrong owner error");
    tx = await propertyContract.connect(somebodyElse).rejectBooking(1);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  // confirm booking
  const price = hre.ethers.utils.parseEther("0.1");
  try {
    console.log("***[!] confirm wrong owner error");
    tx = await propertyContract.connect(somebodyElse).confirmBooking(1, price);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  try {
    console.log("***[!] confirm 0 price error");
    tx = await propertyContract.confirmBooking(1, 0);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  try {
    console.log("***[!] pay unconfirmed error");
    tx = await propertyContract.connect(somebodyElse).payBooking(1);
    await tx.wait();
  } catch (e) {
    console.log(e);
  }
  console.log(
    "before confirmed?: ",
    await propertyContract.bookingConfirmed(1)
  );
  tx = await propertyContract.confirmBooking(1, price);
  await tx.wait();
  console.log("after confirmed?: ", await propertyContract.bookingConfirmed(1));
  book = await propertyContract.getBooking(1);
  console.log("confirmed: ", book);
  // RENTER: pay for the rent
  console.log("before paid?: ", await propertyContract.bookingPaid(1));
  tx = await propertyContract.connect(somebodyElse).payBooking(1);
  await tx.wait();
  console.log("after paid?: ", await propertyContract.bookingPaid(1));
  book = await propertyContract.getBooking(1);
  console.log("paid: ", book);

  // OWNER functions
  // reject booking
  tx = await propertyContract.rejectBooking(1);
  await tx.wait();
  // reserve property
  console.log("before reserved?: ", await propertyContract.propertyReserved(1));
  tx = await propertyContract.reserveProperty(1, timeNow, timeNow + 100);
  await tx.wait();
  console.log("after reserved?: ", await propertyContract.propertyReserved(1));
  book = await propertyContract.getBooking(1);
  console.log("reserve: ", book);
  tx = await propertyContract.rejectBooking(1);
  await tx.wait();
  console.log("reserved?: ", await propertyContract.propertyReserved(1));
  console.log("---[ END ]---");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
