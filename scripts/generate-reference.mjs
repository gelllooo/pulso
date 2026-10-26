import {
  getAllProvinces,
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
} from "@aivangogh/ph-address";
import { writeFileSync } from "node:fs";
const province = getAllProvinces().find((p) => p.name === "Marinduque");
if (!province) throw new Error("Marinduque is absent from the source dataset");
const municipalities = getMunicipalitiesByProvince(province.psgcCode).map(
  (m) => ({ ...m, barangays: getBarangaysByMunicipality(m.psgcCode) }),
);
if (
  municipalities.length !== 6 ||
  municipalities.reduce((n, m) => n + m.barangays.length, 0) !== 218
)
  throw new Error("Review the changed PSGC inventory before updating");
writeFileSync(
  "src/data/marinduque-reference.json",
  JSON.stringify(
    {
      source: "@aivangogh/ph-address 2026.2.4; PSGC as of 30 June 2026",
      sourceUrl: "https://psa.gov.ph/classification/psgc/",
      province,
      municipalities,
    },
    null,
    2,
  ) + "\n",
);
