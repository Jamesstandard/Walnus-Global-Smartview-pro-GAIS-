import { PaintProject } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  owners?: { displayName: string; emailAddress: string }[];
}

export interface GoogleDocContent {
  documentId: string;
  title: string;
  revisionId: string;
  bodyText: string;
  structuralElementsCount: number;
}

/**
 * List files and folders from Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  options?: {
    query?: string;
    folderId?: string;
    mimeTypeFilter?: 'all' | 'docs' | 'folders' | 'json';
    pageSize?: number;
  }
): Promise<DriveFileItem[]> {
  const pageSize = options?.pageSize || 25;
  const queryParts: string[] = ["trashed = false"];

  if (options?.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  }

  if (options?.mimeTypeFilter === 'docs') {
    queryParts.push("mimeType = 'application/vnd.google-apps.document'");
  } else if (options?.mimeTypeFilter === 'folders') {
    queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
  } else if (options?.mimeTypeFilter === 'json') {
    queryParts.push("mimeType = 'application/json'");
  }

  if (options?.query && options.query.trim()) {
    const escapedQuery = options.query.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escapedQuery}'`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent(
    'files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, createdTime, modifiedTime, size, owners)'
  );

  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${pageSize}&fields=${fields}&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google Drive API error (${response.status})`
    );
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create folder in Google Drive');
  }

  return await response.json();
}

/**
 * Upload a JSON or Text file to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileData: {
    name: string;
    mimeType: string;
    content: string;
    parentFolderId?: string;
  }
): Promise<DriveFileItem> {
  const metadata: Record<string, any> = {
    name: fileData.name,
    mimeType: fileData.mimeType,
  };

  if (fileData.parentFolderId) {
    metadata.parents = [fileData.parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${fileData.mimeType}\r\n\r\n` +
    fileData.content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }

  return await response.json();
}

/**
 * Delete a file or folder from Google Drive
 * (Note: Confirmation must be handled in UI before calling this)
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }

  return true;
}

/**
 * Retrieve a Google Doc document structure & text
 */
export async function getGoogleDoc(
  accessToken: string,
  documentId: string
): Promise<GoogleDocContent> {
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Google Doc');
  }

  const doc = await response.json();

  // Extract body plain text from structural elements
  let bodyText = '';
  let elementCount = 0;

  if (doc.body?.content) {
    elementCount = doc.body.content.length;
    for (const elem of doc.body.content) {
      if (elem.paragraph) {
        for (const pe of elem.paragraph.elements || []) {
          if (pe.textRun?.content) {
            bodyText += pe.textRun.content;
          }
        }
      } else if (elem.table) {
        bodyText += '\n[Table Data]\n';
      }
    }
  }

  return {
    documentId: doc.documentId,
    title: doc.title || 'Untitled Document',
    revisionId: doc.revisionId || '1',
    bodyText: bodyText.trim(),
    structuralElementsCount: elementCount,
  };
}

/**
 * Append text to an existing Google Doc via Docs API batchUpdate
 */
export async function appendDocContent(
  accessToken: string,
  documentId: string,
  textToAppend: string
): Promise<void> {
  // First get doc to determine end index
  const getRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!getRes.ok) {
    throw new Error('Failed to retrieve document metadata for appending');
  }

  const doc = await getRes.json();
  const endIndex = doc.body?.content?.[doc.body.content.length - 1]?.endIndex || 1;
  const insertIndex = Math.max(1, endIndex - 1);

  const requests = [
    {
      insertText: {
        location: { index: insertIndex },
        text: `\n\n${textToAppend}\n`,
      },
    },
  ];

  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update Google Doc');
  }
}

/**
 * Creates an official Project Specification & Estimation Document in Google Docs
 */
export async function exportProjectToGoogleDoc(
  accessToken: string,
  project: PaintProject,
  additionalNotes?: string
): Promise<{ documentId: string; url: string; title: string }> {
  const title = `WalnusGlobal SmartView -Pro © Spec - ${project.name}`;

  // 1. Create blank Google Doc via Docs API or Drive
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Doc specification');
  }

  const newDoc = await createRes.json();
  const documentId = newDoc.documentId;

  // 2. Prepare structured specification document text & formatting
  const drumsCount = Math.ceil(project.volumeGallons / 55);
  const formattedDate = new Date(project.lastUpdated || Date.now()).toLocaleDateString('en-US', {
    dateStyle: 'full',
  });

  const structuredContent = `PAINT-SYNC PRO: SITE ESTIMATION & SPECIFICATION REPORT
Generated: ${formattedDate}
Project ID: ${project.id}
System Status: ${project.status.toUpperCase()} (Replicated)

==================================================
1. EXECUTIVE SITE OVERVIEW
==================================================
• Project Name: ${project.name}
• Estimated Surface Area: ${project.surfaceAreaSqFt.toLocaleString()} sq ft
• Target Paint Coating: ${project.paintType}
• Color Designation: ${project.colorName || 'Custom Formulation'} (Hex: ${project.colorHex})
• Required Bulk Volume: ${project.volumeGallons} Gallons
• Packaging Allocation: ${drumsCount} x 55-Gallon Industrial Drums

==================================================
2. FIELD APPLICATION PARAMETERS
==================================================
• Theoretical Coverage: ~350 sq ft / gallon @ 1.5 mils DFT
• Surface Prep Standard: SSPC-SP 13 / NACE No. 6 (Clean, Dry & Free of Contaminants)
• Application Method: Airless Spray or Heavy-Duty Phenolic Core Roller
• Recoat Window: 4 to 8 Hours @ 70°F (21°C)

==================================================
3. HAZMAT & SAFETY COMPLIANCE
==================================================
• GHS-07 Hazard: Skin/Eye Irritant - Safety Glasses & Nitrile Gloves Required
• UN-1263 Classification: Class 3 Flammable/Combustible Liquid Packaging
• Ventilation Requirement: Mandatory forced draft ventilation in enclosed spaces

==================================================
4. SITE INSPECTION NOTES & REVISION LOG
==================================================
${additionalNotes ? additionalNotes : '• Site scanned via WalnusGlobal SmartView -Pro © Optical LiDAR Viewfinder with real-time triangulation.\n• Color spectrophotometry calibrated to laboratory tolerances.\n• Spec approved for factory batch mixing staging.'}

==================================================
END OF OFFICIAL SPECIFICATION DOCUMENT
==================================================
`;

  // 3. Insert structured text into the new Google Doc
  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: structuredContent,
      },
    },
  ];

  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  return {
    documentId,
    title,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/**
 * Creates an official Factory Batch Formulation Sheet in Google Docs
 */
export async function exportFormulationToGoogleDoc(
  accessToken: string,
  project: PaintProject,
  marketPrices: { name: string; price: number }[]
): Promise<{ documentId: string; url: string; title: string }> {
  const title = `Batch Formulation Sheet - ${project.name}`;

  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Doc formulation');
  }

  const newDoc = await createRes.json();
  const documentId = newDoc.documentId;

  const totalDrums = Math.ceil(project.volumeGallons / 55);
  const estimatedCost = project.volumeGallons * 18.5;

  let pricingTable = '';
  if (marketPrices.length > 0) {
    pricingTable = marketPrices
      .map((p) => `• ${p.name.padEnd(32, ' ')} : $${p.price.toFixed(2)}/kg`)
      .join('\n');
  } else {
    pricingTable =
      '• Titanium Dioxide (Base Pigment)    : $3.45/kg\n• Acrylic Resin Binder               : $2.10/kg\n• Custom Tint PB15                  : $12.50/kg\n• Solvent/Water Dispersion Matrix    : $0.80/kg';
  }

  const content = `FACTORY MIXER BATCH FORMULATION & QC LOG
Project Reference: ${project.name} (ID: ${project.id})
Target Volume: ${project.volumeGallons} Gallons (${totalDrums} x 55-Gal Steel Drums)
Target Color Hex: ${project.colorHex}
Estimated Material Expenditure: $${estimatedCost.toLocaleString()}

==================================================
1. RAW MATERIAL MARKET SPECIFICATIONS
==================================================
${pricingTable}

==================================================
2. HIGH-SHEAR DISPERSION & MIXING SEQUENCE
==================================================
Step 1: Charge primary industrial vat with Base Solvent/Water Matrix (30% by weight).
Step 2: Start Cowles disperser at 1200 RPM and slowly introduce Titanium Dioxide.
Step 3: Disperse to Hegman gauge reading 6.5+ for sub-micron particle distribution.
Step 4: Reduce agitation speed to 400 RPM and inject Acrylic Resin polymer binder.
Step 5: Meter in Custom Tint Dispersion to achieve spectrophotometer Delta-E < 0.5.
Step 6: Agitate for 20 minutes; perform Krebs-Stormer viscosity check (95-105 KU).

==================================================
3. PACKAGING & QC VERIFICATION
==================================================
[ ] Viscosity KU Verification Passed
[ ] Color Spectrophotometer Match Confirmed (${project.colorHex})
[ ] UN-1263 / GHS-07 HazMat drum labels affixed
[ ] Automated Drum Gravimetric Fill Completed (${totalDrums} Units)
[ ] Quality Control Supervisor Sign-Off Stamped

Document Generated by WalnusGlobal SmartView -Pro © Workspace Engine
`;

  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: content,
      },
    },
  ];

  await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  return {
    documentId,
    title,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}
