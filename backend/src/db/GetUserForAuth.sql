-- New, minimal stored procedure for the Node/React rewrite's auth flow.
-- Replaces ValidateUser for login purposes:
--   - Does NOT compare the password in SQL (that happens in Node via bcrypt.compare)
--   - Does NOT log the plaintext password anywhere
--   - Only returns what's needed to verify the hash and populate the session/JWT
--
-- Run this once against the database (additive - does not remove ValidateUser,
-- which can stay for any other caller until fully retired).

CREATE PROCEDURE [dbo].[GetUserForAuth]
(
    @UserName VARCHAR(30)
)
AS
BEGIN
    SET NOCOUNT ON

    SELECT TOP 1
        C.ContactID,
        C.Password AS PasswordHash, -- after migration, this holds a bcrypt hash, not plaintext
        ISNULL(Designation,'') AS Designation,
        ISNULL(C.DesignationID,0) AS DesignationID,
        C.Name,
        C.Mobileno,
        C.EmailID,
        C.DepartmentID,
        C.DistrictID,
        D.DistrictEng,
        O.DepartmentName,
        CASE WHEN C.IsHead=1 THEN 1 ELSE 0 END AS IsHead,
        CASE WHEN C.IsANTF=1 THEN 1 ELSE 0 END AS IsANTF,
        C.Status
    FROM dbo.tblContact C
    LEFT JOIN tblDistrict D ON D.DistrictID = C.DistrictID
    LEFT JOIN tblDepartment O ON O.DepartmentID = C.DepartmentID
    WHERE C.UserName = @UserName
    -- Note: Status check happens in Node so we can return a specific
    -- "account disabled" message instead of a generic "invalid credentials"
END
GO
