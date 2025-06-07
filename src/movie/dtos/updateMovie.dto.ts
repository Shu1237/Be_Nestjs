import { IsOptional, IsInt, IsString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMovieDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    description: 'Danh sách ID của các thể loại (genres) liên kết với bộ phim',
    example: [10, 11],
  })
  id_Gerne?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    description: 'Danh sách ID của các diễn viên (actors) liên kết với bộ phim',
    example: [5, 6],
  })
  id_Actor?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    description: 'Danh sách ID của các phiên bản (versions) liên kết với bộ phim',
    example: [2, 3],
  })
  id_Version?: number[];

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Tên của bộ phim', example: 'Inception' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nội dung tóm tắt của bộ phim', example: 'A mind-bending thriller' })
  content?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Tên đạo diễn của bộ phim', example: 'Christopher Nolan' })
  director?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ description: 'Thời lượng của bộ phim (tính bằng phút)', example: 148 })
  duration?: number;

  @IsOptional()
  @ApiProperty({ description: 'Ngày bắt đầu chiếu bộ phim', example: '2025-06-01' })
  from_date?: Date;

  @IsOptional()
  @ApiProperty({ description: 'Ngày kết thúc chiếu bộ phim', example: '2025-06-30' })
  to_date?: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Tên công ty sản xuất bộ phim', example: 'Warner Bros.' })
  production_company?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'URL của hình ảnh thumbnail của bộ phim', example: 'https://example.com/thumbnail.jpg' })
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'URL của hình ảnh banner của bộ phim', example: 'https://example.com/banner.jpg' })
  banner?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: 'Trạng thái xóa của bộ phim (true nếu đã bị xóa)', example: false })
  is_deleted?: boolean;
}