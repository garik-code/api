import { Injectable } from '@nestjs/common';
import { open } from 'geolite2-redist';
import maxmind, { CityResponse, Reader } from 'maxmind';

@Injectable()
export class GeolocationService {
  lookup?: Reader<CityResponse>;

  async initializeService() {
    this.lookup = await open<CityResponse>('GeoLite2-City', path =>
      maxmind.open(path)
    );
  }

  async getGeolocationFromIp(ipAddress: string) {
    if (ipAddress === "::1") ipAddress = "182.64.221.140";
    await this.initializeService();
    return this.lookup.get(ipAddress);
  }
}