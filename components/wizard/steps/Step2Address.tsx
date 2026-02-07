'use client';

/**
 * Step 2: Installation Address
 * Collects installation address with CEP lookup, manual entry, and Google Maps location
 * Requirements: 1.3, 1.4, 1.5, 3.4, 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6
 */

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin } from 'lucide-react';
import { formatCEP } from '@/lib/validation/cep';
import { lookupCEP, ViaCEPError, getViaCEPErrorMessage } from '@/lib/services/viacep';
import { geocodeAddress } from '@/lib/services/googlemaps';
import GoogleMapsLocationPicker from '@/components/wizard/GoogleMapsLocationPicker';
import { Coordinates } from '@/lib/types';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function Step2Address() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepSuccess, setCepSuccess] = useState(false);
  const [mapCenter, setMapCenter] = useState<Coordinates | undefined>(undefined);

  const cepValue = watch('addressCEP');
  const stateValue = watch('addressState');
  const streetValue = watch('addressStreet');
  const cityValue = watch('addressCity');

  // Check if address is sufficiently filled
  const addressFilled = Boolean(
    cepValue && streetValue && cityValue && stateValue
  );

  // Create address string for display
  const addressString = addressFilled 
    ? `${streetValue}, ${cityValue} - ${stateValue}, ${formatCEP(cepValue)}`
    : undefined;

  // Handle CEP lookup
  const handleCEPLookup = async () => {
    if (!cepValue) {
      setCepError('Digite um CEP para buscar');
      return;
    }

    setIsLoadingCEP(true);
    setCepError(null);
    setCepSuccess(false);

    try {
      const address = await lookupCEP(cepValue);
      
      if (address) {
        // Populate address fields
        setValue('addressStreet', address.street);
        setValue('addressNeighborhood', address.neighborhood);
        setValue('addressCity', address.city);
        setValue('addressState', address.state);
        setCepSuccess(true);

        // Try to geocode the address for the map
        const fullAddress = `${address.street}, ${address.city}, ${address.state}, Brasil`;
        const coordinates = await geocodeAddress(fullAddress);
        
        if (coordinates) {
          setMapCenter(coordinates);
        }
      } else {
        setCepError('CEP não encontrado. Por favor, preencha o endereço manualmente.');
      }
    } catch (error) {
      if (error instanceof ViaCEPError) {
        setCepError(getViaCEPErrorMessage(error));
      } else {
        setCepError('Erro ao buscar CEP. Por favor, preencha o endereço manualmente.');
      }
    } finally {
      setIsLoadingCEP(false);
    }
  };

  // Handle CEP formatting on blur
  const handleCEPBlur = () => {
    if (cepValue) {
      setValue('addressCEP', formatCEP(cepValue));
    }
  };

  // Handle location change from map
  const handleLocationChange = (coordinates: Coordinates) => {
    setValue('locationLatitude', coordinates.latitude);
    setValue('locationLongitude', coordinates.longitude);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Endereço</h2>
        <p className="text-sm text-neutral-400">Local da instalação</p>
      </div>

      {/* Form Content - Scrollable if needed */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* CEP Lookup - Compact */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="addressCEP" className="text-sm font-medium text-neutral-300">
              CEP <span className="text-red-400">*</span>
            </Label>
            <Input
              id="addressCEP"
              {...register('addressCEP')}
              placeholder="00000-000"
              onBlur={handleCEPBlur}
              maxLength={9}
              className={`mt-1 ${errors.addressCEP ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleCEPLookup}
              loading={isLoadingCEP}
              loadingText="..."
              variant="secondary"
              size="default"
              className="bg-solar-500 hover:bg-solar-600 text-neutral-900"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {errors.addressCEP && (
          <p className="text-xs text-red-400">{errors.addressCEP.message as string}</p>
        )}
        {cepError && (
          <p className="text-xs text-yellow-400">{cepError}</p>
        )}
        {cepSuccess && (
          <p className="text-xs text-green-400">✓ Endereço encontrado!</p>
        )}

        {/* Address Fields - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Street */}
          <div className="md:col-span-2">
            <Label htmlFor="addressStreet" className="text-sm font-medium text-neutral-300">
              Logradouro <span className="text-red-400">*</span>
            </Label>
            <Input
              id="addressStreet"
              {...register('addressStreet')}
              placeholder="Rua, Avenida, etc."
              className={`mt-1 ${errors.addressStreet ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            />
            {errors.addressStreet && (
              <p className="text-xs text-red-400 mt-1">{errors.addressStreet.message as string}</p>
            )}
          </div>

          {/* Number */}
          <div>
            <Label htmlFor="addressNumber" className="text-sm font-medium text-neutral-300">
              Número <span className="text-red-400">*</span>
            </Label>
            <Input
              id="addressNumber"
              {...register('addressNumber')}
              placeholder="123"
              className={`mt-1 ${errors.addressNumber ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            />
            {errors.addressNumber && (
              <p className="text-xs text-red-400 mt-1">{errors.addressNumber.message as string}</p>
            )}
          </div>

          {/* Complement */}
          <div>
            <Label htmlFor="addressComplement" className="text-sm font-medium text-neutral-300">
              Complemento <span className="text-xs text-neutral-500">(opcional)</span>
            </Label>
            <Input
              id="addressComplement"
              {...register('addressComplement')}
              placeholder="Apto, Bloco"
              className={`mt-1 ${errors.addressComplement ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            />
          </div>

          {/* Neighborhood */}
          <div>
            <Label htmlFor="addressNeighborhood" className="text-sm font-medium text-neutral-300">
              Bairro <span className="text-red-400">*</span>
            </Label>
            <Input
              id="addressNeighborhood"
              {...register('addressNeighborhood')}
              placeholder="Nome do bairro"
              className={`mt-1 ${errors.addressNeighborhood ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            />
            {errors.addressNeighborhood && (
              <p className="text-xs text-red-400 mt-1">{errors.addressNeighborhood.message as string}</p>
            )}
          </div>

          {/* City */}
          <div>
            <Label htmlFor="addressCity" className="text-sm font-medium text-neutral-300">
              Cidade <span className="text-red-400">*</span>
            </Label>
            <Input
              id="addressCity"
              {...register('addressCity')}
              placeholder="Nome da cidade"
              className={`mt-1 ${errors.addressCity ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            />
            {errors.addressCity && (
              <p className="text-xs text-red-400 mt-1">{errors.addressCity.message as string}</p>
            )}
          </div>
        </div>

        {/* State - Full Width */}
        <div>
          <Label htmlFor="addressState" className="text-sm font-medium text-neutral-300">
            Estado <span className="text-red-400">*</span>
          </Label>
          <Select
            value={stateValue}
            onValueChange={(value: string) => setValue('addressState', value)}
          >
            <SelectTrigger className={`mt-1 ${errors.addressState ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white`}>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-600">
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state} value={state} className="text-white hover:bg-neutral-700">
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.addressState && (
            <p className="text-xs text-red-400 mt-1">{errors.addressState.message as string}</p>
          )}
        </div>

        {/* Google Maps - Compact */}
        <div className="border-t border-neutral-700 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-solar-400" />
            <Label className="text-sm font-medium text-neutral-300">
              Localização <span className="text-xs text-neutral-500">(opcional)</span>
            </Label>
          </div>
          <div className="h-48 rounded-lg overflow-hidden">
            <GoogleMapsLocationPicker
              center={mapCenter}
              markerPosition={
                watch('locationLatitude') && watch('locationLongitude')
                  ? {
                      latitude: watch('locationLatitude'),
                      longitude: watch('locationLongitude'),
                    }
                  : undefined
              }
              onLocationChange={handleLocationChange}
              addressFilled={addressFilled}
              addressString={addressString}
            />
          </div>
        </div>
      </div>

      {/* Tip - Fixed at Bottom */}
      <div className="mt-4 p-3 bg-solar-500/10 border border-solar-500/20 rounded-lg">
        <p className="text-xs text-solar-300">
          💡 Use o botão buscar para preencher automaticamente
        </p>
      </div>
    </div>
  );
}
