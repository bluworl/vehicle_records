import { query, update, Canister, Record, StableBTreeMap, Ok, Err, Some, None, Option, Vec, text, int, Variant, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

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

const vehiclesStorage = StableBTreeMap(text, Vehicle, 0);

export default Canister({
  addVehicle: update([VehicleData], Option(Vehicle), (data) => {
    const vehicleId = uuidv4();
    const vehicle = {
      id: vehicleId,
      createdAt: ic.time(),
      updatedAt: None,
      ...data,
    };
    vehiclesStorage.insert(vehicleId, vehicle);
    return Some(vehicle);
  }),

  getVehicles: query([], Vec(Vehicle), () => {
    return vehiclesStorage.values();
  }),

  getVehicle: query([text], Result(Vehicle, Error), (id) => {
    const vehicleOpt = vehiclesStorage.get(id);
    if (vehicleOpt.isNone()) {
      return Err({ NotFound: `Vehicle with id=${id} not found` });
    }
    return Ok(vehicleOpt.unwrap());
  }),

  updateVehicle: update([text, VehicleData], Option(Vehicle), (id, data) => {
    const vehicleOpt = vehiclesStorage.get(id);
    if (vehicleOpt.isNone()) {
      return None;
    }
    const existingVehicle = vehicleOpt.unwrap();
    const updatedVehicle = {
      ...existingVehicle,
      ...data,
      updatedAt: Some(ic.time()),
    };
    vehiclesStorage.insert(id, updatedVehicle);
    return Some(updatedVehicle);
  }),

  deleteVehicle: update([text], Option(Vehicle), (id) => {
    const deletedVehicle = vehiclesStorage.remove(id);
    return deletedVehicle.unwrapOr(None);
  })
});

globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};
