import {PermissionsAndroid, Platform} from "react-native"
import BleManager from "react-native-ble-manager"
import {useEffect} from 'react'

  const requestBlePermissions = async (): Promise<boolean> => {
    if (Platform.OS === "android" && Platform.Version < 23) {
      return true
    }
    try {
      const status = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ])
      return (
        status[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] == "granted" &&
        status[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] == "granted" &&
        status[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] == "granted"
      )
    } catch (e) {
      console.error("Location Permissions Denied ", e)
      return false
    }
  }

// effects
useEffect(() => {
  const initBle = async () => {
    await requestBlePermissions()
    BleManager.enableBluetooth()
  }

  initBle()
}, [])