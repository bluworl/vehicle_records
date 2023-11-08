import { query, update, Canister, Record, StableBTreeMap, Ok, None, Some, Err, Result, text,int, Variant, nat64, ic, Opt, Vec } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define vehicle data structure
const VehicleData = Record({
  latitude: text,
  longitude: text,
  vehicleType: text,
  licensePlate: text,
  fuelStatus: Variant({ Empty: int, Half: int, Full: int })
});

const Vehicle = Record({
  id: text,
  latitude: text,
  longitude: text,
  vehicleType: text,
  licensePlate: text,
  fuelStatus: Variant({ Empty: int, Half: int, Full: int }),
  createdAt: nat64,
  updatedAt: Opt(nat64)
});

const Error = Variant({ NotFound: text, InvalidPayload: text });

// Stable storage for vehicles
const vehiclesStorage = StableBTreeMap(text, Vehicle, 0);

export default Canister({
  // Add a vehicle to vehiclesStorage
  addVehicle: update([VehicleData], Result(Vehicle, Error), (data) => {
    const vehicle = { id: uuidv4(), createdAt: ic.time(), updatedAt: None, ...data };
    vehiclesStorage.insert(vehicle.id, vehicle);
    return Ok(vehicle);
  }),

  // Get all vehicles from the storage
  getVehicles: query([], Result(Vec(Vehicle), Error), () => {
    return Ok(vehiclesStorage.values());
  }),

  // Get a specific vehicle from the storage using the id
  getVehicle: query([text], Result(Vehicle, Error), (id) => {
    const vehicleOpt = vehiclesStorage.get(id);
    if ("None" in vehicleOpt) {
      return Err({ NotFound: `Vehicle with id=${id} not found` });
    }
    return Ok(vehicleOpt.Some);
  }),

  // Update a vehicle already in the storage using the id
  updateVehicle: update([text, VehicleData], Result(Vehicle, Error), (id, data) => {
    const vehicleOpt = vehiclesStorage.get(id);
    if ("None" in vehicleOpt) {
      return Err({ NotFound: `Couldn't update vehicle with id=${id}. Vehicle not found` });
    }
    const vehicle = vehicleOpt.Some;
    const updatedVehicle = { ...vehicle, ...data, updatedAt: Some(ic.time()) };
    vehiclesStorage.insert(vehicle.id, updatedVehicle);
    return Ok(updatedVehicle);
  }),

  // Delete a vehicle from the storage using the id
  deleteVehicle: update([text], Result(Vehicle, Error), (id) => {
    const deletedVehicle = vehiclesStorage.remove(id);
    if ("None" in deletedVehicle) {
      return Err({ NotFound: `Couldn't delete vehicle with id=${id}. Vehicle not found` });
    }
    return Ok(deletedVehicle.Some);
  })
});

// Existing globalThis.crypto code remains unchanged

globalThis.crypto = { 
    // @ts-ignore 
    getRandomValues: () => { let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
    }

    return array;
}

};

