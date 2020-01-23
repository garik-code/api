import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { GeolocationService } from "src/providers/geolocation.service";

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) repo: Repository<User>, public geolocationService: GeolocationService) {
    super(repo);
  }

  async addDefaultValuesToNewUser(dto: User, ipAddress: string) {
    dto.nickname = dto.nickname || dto.name.split(" ")[0];
    if (!dto.countryCode || !dto.timezone) {
      try {
        const location = await this.geolocationService.getGeolocationFromIp(ipAddress);
        dto.countryCode = dto.countryCode || (location.country.iso_code).toLowerCase();
        dto.timezone = dto.timezone || location.location.time_zone;
      } catch {
        dto.countryCode = dto.countryCode || "us";
        dto.timezone = dto.timezone || "America/Los_Angeles";
      }
    }
    return dto;
  }
}