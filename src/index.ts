import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the structure for vehicle data
type VehicleData = Record<{
  latitude: string;
  longitude: string;
  vehicleType: string;
  licensePlate: string;
  fuelStatus: Record<{ Empty: number; Half: number; Full: number }>;
}>;

// Define the structure for a vehicle record
type Vehicle = Record<{
  id: string;
  latitude: string;
  longitude: string;
  vehicleType: string;
  licensePlate: string;
  fuelStatus: Record<{ Empty: number; Half: number; Full: number }>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the structure for error variants
type Error = Record<{ NotFound: string; InvalidPayload: string }>;

// Create a stable storage for vehicles
const vehiclesStorage = new StableBTreeMap<string, Vehicle>(0, 44, 1024);

// Function to add a vehicle to the storage
$update;
export function addVehicle(payload: VehicleData): Result<Vehicle, string> {
  // Payload Validation
  if (
    !payload.latitude ||
    !payload.longitude ||
    !payload.vehicleType ||
    !payload.licensePlate ||
    !payload.fuelStatus
  ) {
    return Result.Err<Vehicle, string>('Missing or invalid fields in the payload.');
  }

  // Explicit Property Setting
  const vehicle: Vehicle = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
  };

  try {
    // Error Handling: Handle any errors during insertion
    vehiclesStorage.insert(vehicle.id, vehicle);
  } catch (error) {
    return Result.Err<Vehicle, string>(`Failed to add the vehicle: ${error}`);
  }

  return Result.Ok(vehicle);
}

// Function to get all vehicles from the storage
$query;
export function getVehicles(): Result<Vec<Vehicle>, Error> {
  return Result.Ok(vehiclesStorage.values());
}

// Function to get a specific vehicle from the storage using the id
$query;
export function getVehicle(id: string): Result<Vehicle, string> {
  // Use match with Some and None for error handling
  return match(vehiclesStorage.get(id), {
    Some: (vehicle) => Result.Ok<Vehicle, string>(vehicle),
    None: () => Result.Err<Vehicle, string>(`Vehicle with id=${id} not found`),
  });
}

// Function to update a vehicle already in the storage using the id
$update;
export function updateVehicle(id: string, payload: VehicleData): Result<Vehicle, string> {
  // Parameter Validation
  if (!id) {
    return Result.Err<Vehicle, string>(`Invalid UUID: ${id}`);
  }

  const vehicleOpt = vehiclesStorage.get(id);

  return match(vehicleOpt, {
    Some: (vehicle) => {
      // Payload Validation
      if (
        !payload.latitude ||
        !payload.longitude ||
        !payload.vehicleType ||
        !payload.licensePlate ||
        !payload.fuelStatus
      ) {
        return Result.Err<Vehicle, string>('Missing or invalid fields in the payload.');
      }

      // Selective Update: Only update allowed fields
      const updatedVehicle: Vehicle = {
        ...vehicle,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Error Handling: Handle any errors during insertion
        vehiclesStorage.insert(updatedVehicle.id, updatedVehicle);
      } catch (error) {
        return Result.Err<Vehicle, string>(`Failed to update the vehicle: ${error}`);
      }

      return Result.Ok<Vehicle, string>(updatedVehicle);
    },
    None: () => Result.Err<Vehicle, string>(`Couldn't update vehicle with id=${id}. Vehicle not found`),
  });
}

// Function to delete a vehicle from the storage using the id
$update;
export function deleteVehicle(id: string): Result<Vehicle, string> {
  const deletedVehicle = vehiclesStorage.remove(id);

  return match(deletedVehicle, {
    Some: (vehicle) => Result.Ok<Vehicle, string>(vehicle),
    None: () => Result.Err<Vehicle, string>(`Couldn't delete vehicle with id=${id}. Vehicle not found`),
  });
}

// Global Configuration
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    // Generate random values for crypto operations
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
