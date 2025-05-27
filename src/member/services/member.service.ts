import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../../typeorm/entities/Member';
import { CreateMemberDto } from '../dtos/create-member.dto';
import { UpdateMemberDto } from '../dtos/update-member.dto';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    try {
      const member = this.memberRepository.create(createMemberDto);
      return await this.memberRepository.save(member);
    } catch {
      throw new BadRequestException(
        'Unable to create member. Please check your information again.',
      );
    }
  }

  async findAll(): Promise<Member[]> {
    return await this.memberRepository.find({
      relations: ['account'],
      order: {
        SCORE: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { MEMBER_ID: id },
      relations: ['account'],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID not found ${id}`);
    }
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    try {
      const member = await this.findOne(id);

      if (updateMemberDto.SCORE !== undefined) {
        member.SCORE = updateMemberDto.SCORE;
      }
      if (updateMemberDto.ACCOUNT_ID !== undefined) {
        member.ACCOUNT_ID = updateMemberDto.ACCOUNT_ID;
      }

      return await this.memberRepository.save(member);
    } catch {
      throw new BadRequestException(
        'Unable to update member. Please check information again.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const member = await this.findOne(id);
      await this.memberRepository.remove(member);
    } catch {
      throw new BadRequestException(
        'Unable to delete member. Please try again later.',
      );
    }
  }
}
