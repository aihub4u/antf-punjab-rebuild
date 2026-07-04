/**
 * Determines what action link(s), if any, a user should see for a given
 * complaint row. Shared between ViewRequest (contact-scoped) and
 * ViewRequestAll (admin-wide) since both render the same row shape from
 * GetRequestList / GetRequestListall respectively.
 *
 * Returns one of:
 *   { type: 'close' }
 *   { type: 'forward_close' }
 *   { type: 'forward_action' }
 *   { type: 'action' }
 *   { type: 'reopen' }
 *   null   - no action available for this user on this row
 */
function computeRowAction(row, user) {
  const isClosed = row['Complaint Status'] === 'Closed';
  const rowUpdate = String(row.Update);
  const designationId = String(user.designationId);
  const isANTF = user.isANTF;
  const allotedTo = String(row.AllotedTo);
  const contactId = String(user.contactId);

  if (user.departmentId === 2) {
    if (!isClosed && rowUpdate === designationId) {
      return { type: 'close' };
    }
    return null;
  }

  if (!isClosed) {
    const updateMatches = rowUpdate === designationId || rowUpdate === '0';

    if (updateMatches && designationId === '4' && !isANTF && allotedTo === contactId) {
      return { type: 'forward_close' };
    }
    if (updateMatches && designationId === '4' && isANTF && allotedTo === contactId) {
      return { type: 'forward_action' };
    }
    if (updateMatches && designationId === '3' && allotedTo === contactId) {
      return { type: 'forward_action', style: 'success' };
    }
    if (rowUpdate === designationId && designationId !== '4' && designationId !== '3') {
      return { type: 'action' };
    }
    return null;
  }

  if (row.DepartmentID !== 0 && row.IsReopen === 0 && designationId === '4') {
    return { type: 'reopen' };
  }
  return null;
}

function fileIconType(fileUrl) {
  if (!fileUrl) return null;
  const ext = fileUrl.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'mpg', 'mpeg'].includes(ext)) return 'video';
  return 'file';
}

// The original app always showed "Add / View Substance" links on closed
// rows (Cells[24]), regardless of role - unlike the action buttons above,
// this isn't gated by designation/ownership at all.
function showsSubstanceLinks(row) {
  return row['Complaint Status'] === 'Closed';
}

module.exports = { computeRowAction, fileIconType, showsSubstanceLinks };
