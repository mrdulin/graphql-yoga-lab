import { ReportService, IClientReportService } from '../ReportService';
import { IReportDefinition } from '../ReportDefinitionService/ReportDefinition';
import { ReportDefinition } from '../ReportDefinitionService';
import _ from 'lodash';
import { ClientReportService } from './AbstractClientReportService';

class GeoPerformanceReportService extends ClientReportService implements IClientReportService {
  public static readonly reportName: string = 'Geo Performance Report';
  private static readonly attributes: string[] = [
    'CampaignId',
    'CampaignName',
    'CampaignStatus',
    'CityCriteriaId',
    'CountryCriteriaId',
    'IsTargetingLocation',
  ];

  private static readonly segments: string[] = [];
  private static readonly metrics: string[] = [
    'Clicks',
    'Conversions',
    'ConversionRate',
    'Cost',
    'Ctr',
    'Impressions',
    'AverageCpc',
  ];
  private static readonly selectorFields = [
    ...GeoPerformanceReportService.attributes,
    ...GeoPerformanceReportService.segments,
    ...GeoPerformanceReportService.metrics,
  ];

  private reportService: ReportService;
  private constructor(opts: { reportService: ReportService }) {
    super();
    this.reportService = opts.reportService;
  }

  public async get(reportDefinition: Partial<IReportDefinition>) {
    const reportDef: IReportDefinition = {
      // order is matter
      selector: _.get(reportDefinition, 'selector', { fields: GeoPerformanceReportService.selectorFields }),
      reportName: GeoPerformanceReportService.reportName,
      reportType: ReportDefinition.ReportType.GEO_PERFORMANCE_REPORT,
      dateRangeType: reportDefinition.dateRangeType || ReportDefinition.DateRangeType.ALL_TIME,
    };

    return this.reportService.reportDownload(reportDef, this.getOptions());
  }
}

export { GeoPerformanceReportService };
