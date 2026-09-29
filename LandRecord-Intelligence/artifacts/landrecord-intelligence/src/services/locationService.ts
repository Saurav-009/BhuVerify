import { demoCadastralData, type CadastralParcel } from '@/data/cadastralData';
export type LocationResolution = { state: 'exact' | 'location-only' | 'unavailable'; parcel?: CadastralParcel; message: string };
export const locationService = {
  resolve: (query: { state: string; district: string; village: string; surveyNumber: string }): LocationResolution => {
    const exact = demoCadastralData.find(p => p.state.toLowerCase() === query.state.toLowerCase() && p.district.toLowerCase() === query.district.toLowerCase() && p.village.toLowerCase() === query.village.toLowerCase() && p.surveyNumber.toLowerCase() === query.surveyNumber.toLowerCase());
    if (exact?.status === 'exact') return { state: 'exact', parcel: exact, message: 'Exact demo parcel match' };
    const location = demoCadastralData.find(p => p.state.toLowerCase() === query.state.toLowerCase() && p.district.toLowerCase() === query.district.toLowerCase() && p.village.toLowerCase() === query.village.toLowerCase());
    if (location) return { state: 'location-only', parcel: location, message: 'Location found; survey parcel not available' };
    return { state: 'unavailable', message: 'No demo cadastral location found for this search' };
  },
};