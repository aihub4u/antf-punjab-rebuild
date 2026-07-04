import { useParams } from 'react-router-dom';
import { useViewDetail } from '../hooks/useApi';

// Every field the original ViewDetail.aspx could show, in its original order,
// grouped by the complaint category it belongs to. The original showed a
// field's row only when it had a value - reproduced here generically rather
// than hand-transcribing ~50 conditional blocks, since the effect is
// identical: irrelevant fields for a given category are simply blank in the
// GetInfo result and so never render.
const FIELD_GROUPS = [
  {
    title: 'Dealer',
    fields: [
      ['DealerName', 'Dealer Name'],
      ['DealerFatherName', "Dealer Father's Name"],
      ['DealerDistrict', 'Dealer District'],
      ['DealerAddress', 'Dealer Address'],
      ['DealerMobileNo', 'Dealer Mobile No'],
    ],
  },
  {
    title: 'Sales Point',
    fields: [
      ['SalesPointDistrict', 'Sales Point District'],
      ['SalesPointLocation', 'Sales Point Location'],
    ],
  },
  {
    title: 'Substance / Unit',
    fields: [
      ['Substance', 'Substance'],
      ['UnitName', 'Unit Name'],
      ['UnitDistrict', 'Unit District'],
      ['UnitAddress', 'Unit Address'],
      ['UnitOwner', 'Unit Owner'],
      ['UnitOwnerFatherName', "Unit Owner's Father Name"],
    ],
  },
  {
    title: 'Owner',
    fields: [
      ['OwnerDistrict', 'Owner District'],
      ['OwnerLocation', 'Owner Location'],
      ['OwnerMobileNo', 'Owner Mobile No'],
    ],
  },
  {
    title: 'Official',
    fields: [
      ['OfficialName', 'Official Name'],
      ['Department', 'Department'],
      ['Designation', 'Designation'],
      ['District', 'District'],
      ['Placement', 'Placement'],
      ['OfficeAddress', 'Office Address'],
      ['OfficialMobileNo', 'Official Mobile No'],
    ],
  },
  {
    title: 'FIR',
    fields: [
      ['ModusOperandi', 'Modus Operandi'],
      ['FIRID', 'FIR No.'],
      ['FIRDate', 'FIR Date'],
      ['FIRYear', 'FIR Year'],
      ['FirDistrict', 'FIR District'],
    ],
  },
  {
    title: 'Addict',
    fields: [
      ['AddictName', 'Addict Name'],
      ['AddictFatherName', "Addict Father's Name"],
      ['AddictDistrict', 'Addict District'],
      ['AddictAddress', 'Addict Address'],
      ['AddictMobileNo', 'Addict Mobile No'],
      ['AddictAge', 'Addict Age'],
      ['AddictSex', 'Addict Sex'],
    ],
  },
  {
    title: 'Victim',
    fields: [
      ['VictimName', 'Victim Name'],
      ['RelationwithAddict', 'Relation with Addict'],
      ['VictimDistrict', 'Victim District'],
      ['VictimAddress', 'Victim Address'],
      ['ViolenceType', 'Violence Type'],
      ['HelpType', 'Help Type'],
    ],
  },
  {
    title: 'Death',
    fields: [
      ['DeathDate', 'Death Date'],
      ['DeathTime', 'Death Time'],
    ],
  },
  {
    title: 'Suspect',
    fields: [
      ['SuspectName', 'Suspect Name'],
      ['SuspectFatherName', "Suspect Father's Name"],
      ['SuspectAddress', 'Suspect Address'],
      ['SuspectRole', 'Suspect Role'],
    ],
  },
  {
    title: 'Operator',
    fields: [
      ['OperatorName', 'Operator Name'],
      ['OperatorDistrict', 'Operator District'],
      ['OperatorAddress', 'Operator Address'],
      ['OperatorMobileNo', 'Operator Mobile No'],
    ],
  },
  {
    title: 'Hot Spot',
    fields: [
      ['DeliveryPoint', 'Delivery Point'],
      ['HotSpotDistrict', 'Hot Spot District'],
      ['HotSpotLocation', 'Hot Spot Location'],
      ['PeddlingTime', 'Peddling Time'],
    ],
  },
  {
    title: 'Centre',
    fields: [
      ['CentreName', 'Centre Name'],
      ['CentreType', 'Centre Type'],
      ['CenterDistrict', 'Centre District'],
      ['CentreAddress', 'Centre Address'],
    ],
  },
  {
    title: 'Feedback / Emergency',
    fields: [
      ['FeedbackType', 'Feedback Type'],
      ['EmergencyLocation', 'Emergency Location'],
      ['EmergencyType', 'Emergency Type'],
      ['PhysicalCondition', 'Physical Condition'],
      ['FinancialCondition', 'Financial Condition'],
      ['Dosage', 'Dosage'],
      ['Frequency', 'Frequency'],
      ['Duration', 'Duration'],
      ['LocationType', 'Location Type'],
      ['IsExpertCall', 'Expert Call'],
    ],
  },
  {
    title: 'Suggestion',
    fields: [
      ['Address', 'Address'],
      ['InstitutionName', 'Institution Name'],
      ['SuggestionType', 'Suggestion Type'],
      ['SuggestionSubType', 'Suggestion Sub Type'],
    ],
  },
  {
    title: 'Volunteer',
    fields: [
      ['VolunteerName', 'Volunteer Name'],
      ['VolunteerDistrict', 'Volunteer District'],
      ['VolunteerAddress', 'Volunteer Address'],
      ['VolunteerMobileNo', 'Volunteer Mobile No'],
      ['ContributionType', 'Contribution Type'],
    ],
  },
];

export default function ViewDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useViewDetail(id);

  if (isLoading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error.response?.data?.error || 'No Record found.'}</div>;

  const info = data.info;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Complaint #{info.InformationID}</h1>
        <span className="text-sm text-slate-500">{info.Cat} {info.SubCat ? `/ ${info.SubCat}` : ''}</span>
      </div>

      <div className="space-y-6">
        {FIELD_GROUPS.map((group) => {
          const visibleFields = group.fields.filter(([key]) => info[key]);
          if (visibleFields.length === 0) return null;
          return (
            <div key={group.title} className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">{group.title}</h2>
              <div className="grid grid-cols-2 gap-4">
                {visibleFields.map(([key, label]) => (
                  <div key={key}>
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-sm font-medium text-slate-800">{info[key]}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Remarks and attachments always show, regardless of value, matching the original */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Remarks</h2>
          <p className="text-sm text-slate-800 mb-4">{info.Remarks || '—'}</p>

          {data.isFileLocationLink ? (
            <a href={info.FileLocation} target="_blank" rel="noreferrer" className="text-[#3e1654] underline text-sm">
              View Attachment
            </a>
          ) : (
            info.FileLocation && <p className="text-sm text-slate-600">{info.FileLocation}</p>
          )}
        </div>

        {info.MoreRemarks && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Additional Remarks</h2>
            <p className="text-sm text-slate-800 mb-4">{info.MoreRemarks}</p>
            {data.isMoreInfoLocationLink ? (
              <a href={info.MoreInfoLocation} target="_blank" rel="noreferrer" className="text-[#3e1654] underline text-sm">
                View Attachment
              </a>
            ) : (
              info.MoreInfoLocation && <p className="text-sm text-slate-600">{info.MoreInfoLocation}</p>
            )}
          </div>
        )}

        {/* Update history / audit trail */}
        {data.history?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-700 p-5 pb-0">Update History</h2>
            <div className="overflow-x-auto p-5">
              <table className="w-full text-sm">
                <thead className="bg-[#500579] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Date Time</th>
                    <th className="px-3 py-2 text-left">Replied By</th>
                    <th className="px-3 py-2 text-left">Allotted To</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Remarks</th>
                    <th className="px-3 py-2 text-left">File</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 odd:bg-[#f6e6ff]">
                      <td className="px-3 py-2 whitespace-nowrap">{row['Date Time']}</td>
                      <td className="px-3 py-2">{row['Replied By']}</td>
                      <td className="px-3 py-2">{row['Allotted To']}</td>
                      <td className="px-3 py-2">{row.Action}</td>
                      <td className="px-3 py-2">{row.Status}</td>
                      <td className="px-3 py-2">{row.Remarks}</td>
                      <td className="px-3 py-2">
                        {row._fileType && (
                          <a href={row.FileName} target="_blank" rel="noreferrer" className="text-[#3e1654] underline">
                            {row._fileType}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
