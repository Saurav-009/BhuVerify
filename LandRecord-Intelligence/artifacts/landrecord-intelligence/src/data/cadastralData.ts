export type CadastralParcel = {
  surveyNumber: string;
  state: string;
  district: string;
  village: string;
  area: string;
  coordinates: [number, number];
  polygon: [number, number][];
  status: 'exact' | 'location-only';
  isSimulatedCadastral?: boolean;
};

export const demoCadastralData: CadastralParcel[] = [
  // Bihar DoLR Dataset — Patna / Sampatchak / Karnpura
  {
    surveyNumber: '108',
    state: 'Bihar',
    district: 'Patna',
    village: 'Karnpura-121',
    area: '0.125 acre (12.5 Dismil)',
    coordinates: [25.5642, 85.1824],
    polygon: [
      [25.5642, 85.1824],
      [25.5650, 85.1824],
      [25.5650, 85.1836],
      [25.5642, 85.1836],
    ],
    status: 'exact',
    isSimulatedCadastral: true,
  },
  {
    surveyNumber: '109',
    state: 'Bihar',
    district: 'Patna',
    village: 'Karnpura-121',
    area: '0.180 acre',
    coordinates: [25.5650, 85.1836],
    polygon: [
      [25.5650, 85.1836],
      [25.5658, 85.1836],
      [25.5658, 85.1848],
      [25.5650, 85.1848],
    ],
    status: 'exact',
    isSimulatedCadastral: true,
  },
  {
    surveyNumber: '110',
    state: 'Bihar',
    district: 'Patna',
    village: 'Karnpura-121',
    area: '0.240 acre',
    coordinates: [25.5642, 85.1836],
    polygon: [
      [25.5642, 85.1836],
      [25.5650, 85.1836],
      [25.5650, 85.1848],
      [25.5642, 85.1848],
    ],
    status: 'exact',
    isSimulatedCadastral: true,
  },

  // Legacy Darbhanga sample parcels
  {
    surveyNumber: '142/3A',
    state: 'Bihar',
    district: 'Darbhanga',
    village: 'Rampur',
    area: '2.84 acre',
    coordinates: [25.9841, 85.9193],
    polygon: [
      [25.9847, 85.9184],
      [25.9852, 85.92],
      [25.9834, 85.9207],
      [25.9829, 85.919],
    ],
    status: 'exact',
  },
  {
    surveyNumber: '142/3B',
    state: 'Bihar',
    district: 'Darbhanga',
    village: 'Rampur',
    area: '1.68 acre',
    coordinates: [25.9848, 85.921],
    polygon: [
      [25.9852, 85.92],
      [25.986, 85.9215],
      [25.9842, 85.9222],
      [25.9834, 85.9207],
    ],
    status: 'exact',
  },
  {
    surveyNumber: '142/2',
    state: 'Bihar',
    district: 'Darbhanga',
    village: 'Rampur',
    area: '3.12 acre',
    coordinates: [25.9836, 85.9179],
    polygon: [
      [25.9839, 85.9165],
      [25.9847, 85.9184],
      [25.9829, 85.919],
      [25.9819, 85.9172],
    ],
    status: 'exact',
  },
  {
    surveyNumber: '88/2',
    state: 'Bihar',
    district: 'Darbhanga',
    village: 'Keshopur',
    area: '1.16 acre',
    coordinates: [25.9515, 85.8762],
    polygon: [],
    status: 'location-only',
  },
];