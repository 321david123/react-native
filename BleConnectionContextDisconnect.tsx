BleManager.disconnect(BLE_SERVICE_ID)
  .then(() => {
    dispatch({ type: "disconnected", payload: { peripheral } })
  })
  .catch((error) => {
    // Failure code
    console.log(error);
  });