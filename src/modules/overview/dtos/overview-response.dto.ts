export interface OverviewSummaryDto {
  totalRevenue: number;
  ticketsSold: number;
  totalCustomers: number;
  activeMovies: number;
}

export interface TicketTypeSaleDto {
  ticketName: string;
  audienceType: string;
  totalSold: number;
  totalRevenue: number;
}

export interface BestSellingComboDto {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface TimeSlotReportDto {
  hour: number;
  timeSlot: string;
  ticketsSold: number;
  revenue: number;
}

export interface PeakHoursRevenueDto {
  category: string;
  totalRevenue: number;
  totalTickets: number;
  averageRevenuePerHour: number;
}

export interface TopMovieDto {
  movieName: string;
  director: string;
  duration: number;
  thumbnail: string;
  trailer: string;
  description: string;
  ticketsSold: number;
  totalRevenue: number;
}

export interface TopCustomerDto {
  username: string;
  email: string;
  avatar: string;
  totalOrders: number;
  totalTickets: number;
  totalSpent: number;
}

export interface OverviewReportsDto {
  ticketTypeSales: TicketTypeSaleDto[];
  bestSellingCombo: BestSellingComboDto[];
  timeSlotReport: TimeSlotReportDto[];
  revenueByPeakHours: PeakHoursRevenueDto[];
  topMoviesByRevenue: TopMovieDto[];
  topCustomersByBookings: TopCustomerDto[];
}

export interface OverviewResponseDto {
  summary: OverviewSummaryDto;
  reports: OverviewReportsDto;
}
