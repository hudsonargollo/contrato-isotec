# Google Maps Location Picker Component

## Overview

The `GoogleMapsLocationPicker` component provides an interactive map interface for capturing precise geographic coordinates of installation sites. It integrates with the Google Maps JavaScript API and validates that coordinates are within Brazil's boundaries.

## Requirements

- **3A.1**: Google Maps JavaScript API integration
- **3A.2**: Auto-centering when address is entered
- **3A.3**: Interactive pin placement
- **3A.4**: Coordinate capture
- **3A.6**: Manual pin adjustment

## Usage

### Basic Usage

```tsx
import GoogleMapsLocationPicker from '@/components/wizard/GoogleMapsLocationPicker';
import { Coordinates } from '@/lib/types';
import { useState } from 'react';

function AddressStep() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const handleLocationChange = (coords: Coordinates) => {
    setCoordinates(coords);
    console.log('New coordinates:', coords);
  };

  return (
    <div>
      <GoogleMapsLocationPicker
        onLocationChange={handleLocationChange}
      />
    </div>
  );
}
```

### With Auto-Centering (After ViaCEP Lookup)

```tsx
import GoogleMapsLocationPicker from '@/components/wizard/GoogleMapsLocationPicker';
import { geocodeAddress } from '@/lib/services/googlemaps';
import { Coordinates } from '@/lib/types';
import { useState, useEffect } from 'react';

function AddressStep() {
  const [address, setAddress] = useState('');
  const [mapCenter, setMapCenter] = useState<Coordinates | undefined>();
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  // When address is auto-filled via ViaCEP, geocode it
  useEffect(() => {
    if (address) {
      geocodeAddress(address).then((coords) => {
        if (coords) {
          setMapCenter(coords);
        }
      });
    }
  }, [address]);

  const handleLocationChange = (coords: Coordinates) => {
    setCoordinates(coords);
  };

  return (
    <div>
      {/* Address input fields here */}
      
      <GoogleMapsLocationPicker
        center={mapCenter}
        onLocationChange={handleLocationChange}
      />
    </div>
  );
}
```

### With Existing Coordinates (Edit Mode)

```tsx
import GoogleMapsLocationPicker from '@/components/wizard/GoogleMapsLocationPicker';
import { Coordinates } from '@/lib/types';
import { useState } from 'react';

function EditContractLocation({ existingCoords }: { existingCoords: Coordinates }) {
  const [coordinates, setCoordinates] = useState<Coordinates>(existingCoords);

  const handleLocationChange = (coords: Coordinates) => {
    setCoordinates(coords);
  };

  return (
    <div>
      <GoogleMapsLocationPicker
        center={existingCoords}
        markerPosition={existingCoords}
        onLocationChange={handleLocationChange}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLocationChange` | `(coordinates: Coordinates) => void` | Yes | Callback function called when user places or moves the marker |
| `center` | `Coordinates` | No | Initial center coordinates for the map. Use this to auto-center after address lookup |
| `markerPosition` | `Coordinates` | No | Initial marker position (for edit mode when coordinates already exist) |
| `className` | `string` | No | Optional CSS class name for the container |

## Features

### Interactive Pin Placement
- Click anywhere on the map to place a marker
- Drag the marker to adjust the location
- Coordinates are captured and validated in real-time

### Auto-Centering
- When the `center` prop changes (e.g., after ViaCEP address lookup), the map automatically centers on the new location
- Zoom level adjusts based on whether a specific address is provided

### Coordinate Validation
- All coordinates are validated to ensure they fall within Brazil's geographic boundaries
- Invalid coordinates trigger an error message
- Boundaries: Latitude -33.75 to 5.27, Longitude -73.99 to -34.79

### Coordinate Display
- Selected coordinates are displayed below the map with 8 decimal places of precision
- Format: `latitude, longitude` (e.g., `-23.55050000, -46.63330000`)

### Error Handling
- Graceful handling of API key issues
- Network timeout handling
- User-friendly error messages
- Location pin is optional - errors don't block form submission

## Styling

The component uses Tailwind CSS classes and follows the dark theme design:
- Map container: 400px height, rounded corners, dark border
- Coordinate display: Blue accent background
- Error messages: Red accent background
- Loading state: Animated spinner

## Environment Configuration

Ensure the Google Maps API key is configured in `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Integration with Form State

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import GoogleMapsLocationPicker from '@/components/wizard/GoogleMapsLocationPicker';

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

function AddressForm() {
  const { register, setValue, watch } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const handleLocationChange = (coords: Coordinates) => {
    setValue('locationLatitude', coords.latitude);
    setValue('locationLongitude', coords.longitude);
  };

  return (
    <form>
      {/* Address fields */}
      
      <GoogleMapsLocationPicker
        onLocationChange={handleLocationChange}
      />
    </form>
  );
}
```

## Accessibility

- Map is keyboard accessible via Google Maps default controls
- Error messages are announced to screen readers
- Loading states provide visual feedback
- Instructions guide users on how to interact with the map

## Performance

- Google Maps API is loaded lazily only when the component mounts
- Single loader instance is reused across the application
- Map instance is preserved during component lifecycle
- Marker updates are optimized to avoid unnecessary re-renders
