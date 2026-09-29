import { useEffect } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CadastralParcel } from '@/data/cadastralData';
import type { LocationResolution } from '@/services/locationService';

const markerIcon = L.divIcon({ className: 'demo-parcel-marker', html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#a65435;border:3px solid #fbf8f1;box-shadow:0 1px 4px #202e35"></span>', iconSize: [16,16], iconAnchor: [8,8] });
function ResetView({ parcel }: { parcel?: CadastralParcel }) { const map=useMap(); useEffect(()=>{if(parcel) map.setView(parcel.coordinates,16)},[map,parcel]); return null; }
export function CadastralMap({ result, parcels }: { result: LocationResolution; parcels: CadastralParcel[] }) {
  const selected = result.parcel;
  const visibleParcels = result.state === 'unavailable' ? [] : parcels;
  return <MapContainer center={selected?.coordinates ?? [25.9841,85.9193]} zoom={15} scrollWheelZoom className="h-full w-full min-h-[440px]" data-testid="map-cadastral">
    <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <ResetView parcel={selected} />
    {visibleParcels.filter(p=>p.polygon.length>0).map(p=><Polygon key={p.surveyNumber} positions={p.polygon} pathOptions={{color:p.surveyNumber===selected?.surveyNumber?'#a65435':'#718a76', weight:p.surveyNumber===selected?.surveyNumber?4:2, fillColor:p.surveyNumber===selected?.surveyNumber?'#e8c9a7':'#c9d6bd', fillOpacity:p.surveyNumber===(selected?.surveyNumber ?? '')?0.5:0.35}}>
      <Popup><strong>Survey {p.surveyNumber}</strong><br/>Area: {p.area}<br/><span className="text-xs">Reference cadastral parcel · demo</span></Popup>
    </Polygon>)}
    {selected&&<Marker position={selected.coordinates} icon={markerIcon}><Popup><strong>Target: Survey {selected.surveyNumber}</strong><br/>Rampur, Darbhanga<br/><span className="text-xs">Extracted/reference location</span></Popup></Marker>}
  </MapContainer>;
}