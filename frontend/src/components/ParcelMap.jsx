import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet';

function ParcelMap({ gis }) {
  if (!gis?.center) return null;

  const center = [gis.center.lat, gis.center.lon];
  return (
    <MapContainer center={center} zoom={15} style={{ height: '320px', width: '100%', marginTop: '1rem' }}>
      <TileLayer url={gis.tile_provider} attribution='&copy; OpenStreetMap contributors' />
      <Marker position={center}>
        <Popup>{gis.parcel_id}</Popup>
      </Marker>
      {gis.polygon && <Polygon positions={gis.polygon} pathOptions={{ color: 'green' }} />}
    </MapContainer>
  );
}

export default ParcelMap;
