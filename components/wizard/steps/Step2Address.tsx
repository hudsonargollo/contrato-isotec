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
    <div className="space-y-6">
      {/* CEP Lookup */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="addressCEP">
            CEP <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="addressCEP"
              {...register('addressCEP')}
              placeholder="00000-000"
              onBlur={handleCEPBlur}
              maxLength={9}
              className={errors.addressCEP ? 'border-red-500' : ''}
            />
            <Button
              type="button"
              onClick={handleCEPLookup}
              loading={isLoadingCEP}
              loadingText="Buscando..."
              variant="secondary"
            >
              <Search className="w-4 h-4" />
              <span className="ml-2">Buscar</span>
            </Button>
          </div>
          {errors.addressCEP && (
            <p className="text-sm text-red-500">
              {errors.addressCEP.message as string}
            </p>
          )}
          {cepError && (
            <p className="text-sm text-yellow-500">{cepError}</p>
          )}
          {cepSuccess && (
            <p className="text-sm text-green-500">
              ✓ Endereço encontrado! Você pode editar os campos se necessário.
            </p>
          )}
        </div>

        {/* Street */}
        <div className="space-y-2">
          <Label htmlFor="addressStreet">
            Logradouro <span className="text-red-500">*</span>
          </Label>
          <Input
            id="addressStreet"
            {...register('addressStreet')}
            placeholder="Rua, Avenida, etc."
            className={errors.addressStreet ? 'border-red-500' : ''}
          />
          {errors.addressStreet && (
            <p className="text-sm text-red-500">
              {errors.addressStreet.message as string}
            </p>
          )}
        </div>

        {/* Number and Complement */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="addressNumber">
              Número <span className="text-red-500">*</span>
            </Label>
            <Input
              id="addressNumber"
              {...register('addressNumber')}
              placeholder="123"
              className={errors.addressNumber ? 'border-red-500' : ''}
            />
            {errors.addressNumber && (
              <p className="text-sm text-red-500">
                {errors.addressNumber.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressComplement">
              Complemento <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="addressComplement"
              {...register('addressComplement')}
              placeholder="Apto, Bloco, etc."
              className={errors.addressComplement ? 'border-red-500' : ''}
            />
            {errors.addressComplement && (
              <p className="text-sm text-red-500">
                {errors.addressComplement.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Neighborhood */}
        <div className="space-y-2">
          <Label htmlFor="addressNeighborhood">
            Bairro <span className="text-red-500">*</span>
          </Label>
          <Input
            id="addressNeighborhood"
            {...register('addressNeighborhood')}
            placeholder="Nome do bairro"
            className={errors.addressNeighborhood ? 'border-red-500' : ''}
          />
          {errors.addressNeighborhood && (
            <p className="text-sm text-red-500">
              {errors.addressNeighborhood.message as string}
            </p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="addressCity">
              Cidade <span className="text-red-500">*</span>
            </Label>
            <Input
              id="addressCity"
              {...register('addressCity')}
              placeholder="Nome da cidade"
              className={errors.addressCity ? 'border-red-500' : ''}
            />
            {errors.addressCity && (
              <p className="text-sm text-red-500">
                {errors.addressCity.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressState">
              Estado <span className="text-red-500">*</span>
            </Label>
            <Select
              value={stateValue}
              onValueChange={(value: string) => setValue('addressState', value)}
            >
              <SelectTrigger className={errors.addressState ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.addressState && (
              <p className="text-sm text-red-500">
                {errors.addressState.message as string}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Google Maps Location Picker */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <Label>
            Localização no Mapa <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Clique no mapa para marcar a localização exata da instalação. Isso ajudará na criação de mockups 3D.
        </p>
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

      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Dica:</strong> Use o botão &quot;Buscar&quot; para preencher automaticamente o endereço a partir do CEP. 
          A localização no mapa é opcional, mas recomendada para maior precisão.
        </p>
      </div>
    </div>
  );
}
