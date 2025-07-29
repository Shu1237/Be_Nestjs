import { PartialType } from '@nestjs/mapped-types';
import { CreateActorDto } from './createActor.dto';

export class UpdateActorDto extends PartialType(CreateActorDto) {}
