import type {
  IncidentReport,
  Municipality,
  ReportCategory,
  ReportStatus,
} from "../types";

export function fromRemote(
  row: Record<string, any>,
  isPublic = false,
): IncidentReport {
  const contact = row.report_private?.[0] || row.report_private || {};
  const review = row.report_reviews?.[0] || row.report_reviews || {};
  return {
    id: row.id,
    clientReportId: row.client_report_id || row.id,
    ownerUserId: row.owner_id || null,
    referenceNumber:
      row.reference_number || `PULSO-${row.id.slice(0, 8).toUpperCase()}`,
    category: row.category as ReportCategory,
    description:
      row.description ||
      row.public_update ||
      "Verified community incident. Follow official instructions.",
    observationTime: row.observed_at || row.created_at,
    reportedTime: row.created_at,
    municipality: row.municipality as Municipality,
    barangay: row.barangay,
    barangayCode: row.barangay_code,
    sitioOrLandmark: row.landmark || "",
    lat: row.latitude,
    lng: row.longitude,
    locationSource: row.location_source,
    urgency: row.urgency,
    immediateDanger: row.urgency === "immediate_danger",
    status: row.status as ReportStatus,
    reporterRole: "resident_guest",
    reporterName: contact.reporter_name || undefined,
    reporterContact: contact.reporter_contact || undefined,
    isAnonymous: !contact.reporter_name,
    idempotencyKey: row.client_report_id || row.id,
    syncedAt: row.created_at,
    lastUpdatedAt: row.updated_at,
    livelihoodDetails: row.livelihood_details || undefined,
    isPublic,
    verification: review.verification || undefined,
    assignment: review.assignment || undefined,
  };
}
export function submissionPayload(report: IncidentReport) {
  // Deliberately exclude local status, verification, role, owner and audit fields.
  return {
    clientReportId: report.clientReportId,
    category: report.category,
    description: report.description,
    observationTime: report.observationTime,
    municipality: report.municipality,
    barangayCode: report.barangayCode,
    sitioOrLandmark: report.sitioOrLandmark,
    lat: report.lat,
    lng: report.lng,
    urgency: report.urgency,
    locationSource: report.locationSource,
    reporterName: report.isAnonymous ? null : report.reporterName,
    reporterContact: report.isAnonymous ? null : report.reporterContact,
    livelihoodDetails: report.livelihoodDetails,
  };
}
