export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY;
  if (!AIRTABLE_TOKEN) {
    console.error('Missing AIRTABLE_API_KEY env var');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const BASE_ID = 'appcpul9UOCOYYIJQ';
  const TABLE_ID = 'tblDtLAVBdqUwo92k';

  const { jmeno, prijmeni, email, telefon, bydliste, typ, poznamka, soubor } = req.body || {};

  if (!jmeno || !prijmeni || !email || !telefon || !bydliste || !typ) {
    return res.status(400).json({ error: 'Chybí povinné údaje' });
  }

  const fields = {
    fldgBs3Uj4DNipMur: jmeno,
    fld6EtXSeMFBXIXZH: prijmeni,
    fld1QTTl15Imv3iVl: email,
    fldLcICZrFeO5fbT2: telefon,
    fld45Imup1CEsNxuR: bydliste,
    fldyZBPzO2Kqug11j: typ,
    fldR2pF1YNNUTtfzo: new Date().toISOString(),
    fldArRbpPV8Rfyy1A: 'Nová',
    fld736K0XDMjVDTGE: 'Web formulář',
  };
  if (poznamka) fields.fldPfchuklBxgTxpq = poznamka;

  try {
    const airtableRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });

    const data = await airtableRes.json();
    if (!airtableRes.ok) {
      console.error('Airtable error', data);
      return res.status(502).json({ error: 'Nepodařilo se uložit poptávku' });
    }

    const recordId = data.records[0].id;

    if (soubor && soubor.dataUrl && soubor.filename) {
      const base64 = String(soubor.dataUrl).split(',')[1];
      if (base64) {
        const uploadRes = await fetch(
          `https://content.airtable.com/v0/${BASE_ID}/${recordId}/fld4MEJIPkS9b2ffb/uploadAttachment`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentType: soubor.contentType || 'application/octet-stream',
              filename: soubor.filename,
              file: base64,
            }),
          }
        );
        if (!uploadRes.ok) {
          console.error('Attachment upload failed', await uploadRes.text());
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-lead error', err);
    return res.status(500).json({ error: 'Neočekávaná chyba' });
  }
}
