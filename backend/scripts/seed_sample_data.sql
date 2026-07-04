/*
================================================================================
 ANTF Punjab - Sample/Test Data Seed Script
================================================================================
 Run this against your TEST database (hitesh_police on Somee) to populate
 enough realistic data to actually exercise Dashboard, View Request, Reports,
 and Close Status end-to-end. Safe to run on an empty database - checks for
 existing rows before inserting reference data, so re-running won't create
 duplicates of districts/departments/designations/categories. The sample
 complaints (tblInfo) ARE inserted fresh each run, so don't run this
 repeatedly unless you want more sample rows piling up.

 Do NOT run this against production data.
================================================================================
*/

-- --------------------------------------------------------------------------
-- 1. Departments
-- --------------------------------------------------------------------------
SET IDENTITY_INSERT tblDepartment ON;
IF NOT EXISTS (SELECT 1 FROM tblDepartment WHERE DepartmentID = 1)
    INSERT INTO tblDepartment (DepartmentID, DepartmentName, Status) VALUES (1, 'Police', 1);
IF NOT EXISTS (SELECT 1 FROM tblDepartment WHERE DepartmentID = 2)
    INSERT INTO tblDepartment (DepartmentID, DepartmentName, Status) VALUES (2, 'Health', 1);
SET IDENTITY_INSERT tblDepartment OFF;
GO

-- --------------------------------------------------------------------------
-- 2. Designations (IDs matter - the application code has hardcoded checks
--    against DesignationID 1/2/3/4/5, so these specific IDs must exist)
-- --------------------------------------------------------------------------
SET IDENTITY_INSERT tblDesignation ON;
IF NOT EXISTS (SELECT 1 FROM tblDesignation WHERE DesignationID = 1)
    INSERT INTO tblDesignation (DesignationID, Designation, Status, ParentID) VALUES (1, 'Admin', 1, NULL);
IF NOT EXISTS (SELECT 1 FROM tblDesignation WHERE DesignationID = 2)
    INSERT INTO tblDesignation (DesignationID, Designation, Status, ParentID) VALUES (2, 'Health Officer', 1, NULL);
IF NOT EXISTS (SELECT 1 FROM tblDesignation WHERE DesignationID = 3)
    INSERT INTO tblDesignation (DesignationID, Designation, Status, ParentID) VALUES (3, 'District Head', 1, NULL);
IF NOT EXISTS (SELECT 1 FROM tblDesignation WHERE DesignationID = 4)
    INSERT INTO tblDesignation (DesignationID, Designation, Status, ParentID) VALUES (4, 'Investigator', 1, NULL);
IF NOT EXISTS (SELECT 1 FROM tblDesignation WHERE DesignationID = 5)
    INSERT INTO tblDesignation (DesignationID, Designation, Status, ParentID) VALUES (5, 'Viewer', 1, NULL);
SET IDENTITY_INSERT tblDesignation OFF;
GO

-- --------------------------------------------------------------------------
-- 3. Districts (a representative handful of real Punjab districts)
-- --------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM tblDistrict WHERE DistrictEng = 'Amritsar')
    INSERT INTO tblDistrict (DistrictEng, DistrictPun, Status) VALUES ('Amritsar', N'ਅੰਮ੍ਰਿਤਸਰ', 1);
IF NOT EXISTS (SELECT 1 FROM tblDistrict WHERE DistrictEng = 'Ludhiana')
    INSERT INTO tblDistrict (DistrictEng, DistrictPun, Status) VALUES ('Ludhiana', N'ਲੁਧਿਆਣਾ', 1);
IF NOT EXISTS (SELECT 1 FROM tblDistrict WHERE DistrictEng = 'Jalandhar')
    INSERT INTO tblDistrict (DistrictEng, DistrictPun, Status) VALUES ('Jalandhar', N'ਜਲੰਧਰ', 1);
IF NOT EXISTS (SELECT 1 FROM tblDistrict WHERE DistrictEng = 'Patiala')
    INSERT INTO tblDistrict (DistrictEng, DistrictPun, Status) VALUES ('Patiala', N'ਪਟਿਆਲਾ', 1);
IF NOT EXISTS (SELECT 1 FROM tblDistrict WHERE DistrictEng = 'Bathinda')
    INSERT INTO tblDistrict (DistrictEng, DistrictPun, Status) VALUES ('Bathinda', N'ਬਠਿੰਡਾ', 1);
GO

-- --------------------------------------------------------------------------
-- 4. Police Stations (a couple per district)
-- --------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM tblPoliceStation WHERE PoliceStationName = 'Amritsar City PS')
    INSERT INTO tblPoliceStation (PoliceStationName, DistrictID, Status)
    SELECT 'Amritsar City PS', DistrictID, 1 FROM tblDistrict WHERE DistrictEng = 'Amritsar';
IF NOT EXISTS (SELECT 1 FROM tblPoliceStation WHERE PoliceStationName = 'Amritsar Sadar PS')
    INSERT INTO tblPoliceStation (PoliceStationName, DistrictID, Status)
    SELECT 'Amritsar Sadar PS', DistrictID, 1 FROM tblDistrict WHERE DistrictEng = 'Amritsar';
IF NOT EXISTS (SELECT 1 FROM tblPoliceStation WHERE PoliceStationName = 'Ludhiana Division 1')
    INSERT INTO tblPoliceStation (PoliceStationName, DistrictID, Status)
    SELECT 'Ludhiana Division 1', DistrictID, 1 FROM tblDistrict WHERE DistrictEng = 'Ludhiana';
IF NOT EXISTS (SELECT 1 FROM tblPoliceStation WHERE PoliceStationName = 'Jalandhar City PS')
    INSERT INTO tblPoliceStation (PoliceStationName, DistrictID, Status)
    SELECT 'Jalandhar City PS', DistrictID, 1 FROM tblDistrict WHERE DistrictEng = 'Jalandhar';
IF NOT EXISTS (SELECT 1 FROM tblPoliceStation WHERE PoliceStationName = 'Patiala Kotwali')
    INSERT INTO tblPoliceStation (PoliceStationName, DistrictID, Status)
    SELECT 'Patiala Kotwali', DistrictID, 1 FROM tblDistrict WHERE DistrictEng = 'Patiala';
GO

-- --------------------------------------------------------------------------
-- 5. Categories (avoid IDs 49/50/51 - GetRequestList/ReportDistrictWise
--    explicitly exclude those from every query)
-- --------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM tblCategory WHERE Category = 'Drug Peddling')
    INSERT INTO tblCategory (Category, CategoryP, ParentID, DepartmentID, Ownership, Status, TypeID)
    VALUES ('Drug Peddling', N'ਨਸ਼ਾ ਵੇਚਣਾ', NULL, 1, 'HeadQuarter', 1, 1);
IF NOT EXISTS (SELECT 1 FROM tblCategory WHERE Category = 'Illegal Sale Point')
    INSERT INTO tblCategory (Category, CategoryP, ParentID, DepartmentID, Ownership, Status, TypeID)
    VALUES ('Illegal Sale Point', N'ਗੈਰ-ਕਾਨੂੰਨੀ ਵਿਕਰੀ', NULL, 1, 'District', 1, 1);
IF NOT EXISTS (SELECT 1 FROM tblCategory WHERE Category = 'Suspicious Activity')
    INSERT INTO tblCategory (Category, CategoryP, ParentID, DepartmentID, Ownership, Status, TypeID)
    VALUES ('Suspicious Activity', N'ਸ਼ੱਕੀ ਗਤੀਵਿਧੀ', NULL, 1, 'HeadQuarter', 1, 1);
GO

-- --------------------------------------------------------------------------
-- 6. A couple more test employees at different designations/districts,
--    so you can test role-based behavior (ownership, action buttons, etc.)
--    beyond just the Admin account. Passwords are plaintext here -
--    run migratePasswords.js (or the /run-migration route) again after
--    this to hash them, same as the first test user.
-- --------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM tblContact WHERE UserName = 'investigator1')
    INSERT INTO tblContact (Name, MobileNo, EmailID, DistrictID, DepartmentID, DesignationID, IsHead, Password, Status, UserName, IsANTF)
    SELECT 'Investigator One', '9888800001', 'investigator1@example.com', DistrictID, 1, 4, 0, 'Test@1234', 1, 'investigator1', 1
    FROM tblDistrict WHERE DistrictEng = 'Amritsar';

IF NOT EXISTS (SELECT 1 FROM tblContact WHERE UserName = 'districthead1')
    INSERT INTO tblContact (Name, MobileNo, EmailID, DistrictID, DepartmentID, DesignationID, IsHead, Password, Status, UserName, IsANTF)
    SELECT 'District Head One', '9888800002', 'districthead1@example.com', DistrictID, 1, 3, 1, 'Test@1234', 1, 'districthead1', 0
    FROM tblDistrict WHERE DistrictEng = 'Ludhiana';

IF NOT EXISTS (SELECT 1 FROM tblContact WHERE UserName = 'viewer1')
    INSERT INTO tblContact (Name, MobileNo, EmailID, DistrictID, DepartmentID, DesignationID, IsHead, Password, Status, UserName, IsANTF)
    SELECT 'Viewer One', '9888800003', 'viewer1@example.com', DistrictID, 1, 5, 0, 'Test@1234', 1, 'viewer1', 0
    FROM tblDistrict WHERE DistrictEng = 'Jalandhar';
GO

-- --------------------------------------------------------------------------
-- 7. Sample complaints (tblInfo) - a spread of statuses, districts,
--    categories, and sources so every page has something to show.
--    Dates are relative to GETDATE() so this works whenever you run it.
-- --------------------------------------------------------------------------
DECLARE @AmritsarID INT = (SELECT DistrictID FROM tblDistrict WHERE DistrictEng = 'Amritsar');
DECLARE @LudhianaID INT = (SELECT DistrictID FROM tblDistrict WHERE DistrictEng = 'Ludhiana');
DECLARE @JalandharID INT = (SELECT DistrictID FROM tblDistrict WHERE DistrictEng = 'Jalandhar');
DECLARE @PatialaID INT = (SELECT DistrictID FROM tblDistrict WHERE DistrictEng = 'Patiala');
DECLARE @BathindaID INT = (SELECT DistrictID FROM tblDistrict WHERE DistrictEng = 'Bathinda');

DECLARE @CatDrug INT = (SELECT CategoryID FROM tblCategory WHERE Category = 'Drug Peddling');
DECLARE @CatSale INT = (SELECT CategoryID FROM tblCategory WHERE Category = 'Illegal Sale Point');
DECLARE @CatSuspicious INT = (SELECT CategoryID FROM tblCategory WHERE Category = 'Suspicious Activity');

DECLARE @AmritsarPS INT = (SELECT TOP 1 PoliceStationID FROM tblPoliceStation WHERE DistrictID = @AmritsarID);

-- Pending, unresolved - shows up in "Open" View Request
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -2, GETDATE()), 'Pending', 'Open', @CatDrug, 'Drug Peddling', 1, 'HeadQuarter',
    'Gurpreet Singh', '9876500001', @AmritsarID, 1, 0, NULL, 0, 0, 4);

INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -5, GETDATE()), 'Pending', 'Open', @CatSale, 'Illegal Sale Point', 1, 'District',
    'Ravinder Kaur', '9876500002', @LudhianaID, 1, 0, NULL, 1, 0, 3);

-- Spam - closed
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -10, GETDATE()), 'Spam', 'Closed', @CatSuspicious, 'Suspicious Activity', 1, 'HeadQuarter',
    'Test Name', '9876500003', @JalandharID, 1, 0, NULL, 0, 0, 4);

-- Incomplete - closed
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -12, GETDATE()), 'Incomplete', 'Closed', @CatDrug, 'Drug Peddling', 1, 'District',
    'Amanpreet Singh', '9876500004', @PatialaID, 1, 0, NULL, 0, 0, 4);

-- Not Verifiable - closed
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -15, GETDATE()), 'Not Verifiable', 'Closed', @CatSale, 'Illegal Sale Point', 1, 'HeadQuarter',
    'Balwinder Kaur', '9876500005', @BathindaID, 1, 0, NULL, 1, 0, 4);

-- Action Taken, FIR registered, with FIR district/station populated - exercises Update 5
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, FIRrDate, NoOfAccusedPeople, ActionResult,
    FIRDistrictID, FIRStationID, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -20, GETDATE()), 'Action Taken', 'Closed', @CatDrug, 'Drug Peddling', 1, 'HeadQuarter',
    'Harjit Singh', '9876500006', @AmritsarID, 1, 1, DATEADD(DAY, -18, GETDATE()), 2, 'FIR Registered',
    @AmritsarID, @AmritsarPS, NULL, 0, 0, 4);

-- Action Taken, no FIR, with an Action Result value (Update 1/2/3 exercise)
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ActionResult, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -22, GETDATE()), 'Action Taken', 'Closed', @CatDrug, 'Drug Peddling', 1, 'District',
    'Simran Kaur', '9876500007', @LudhianaID, 1, 0, 'Already in Jail', NULL, 1, 0, 4);

-- A few more Pending/Open rows across districts, for volume in View Request / Dashboard
INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -1, GETDATE()), 'Pending', 'Open', @CatSuspicious, 'Suspicious Activity', 1, 'HeadQuarter',
    'Jasbir Singh', '9876500008', @JalandharID, 1, 0, NULL, 0, 0, 4);

INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -3, GETDATE()), 'Pending', 'Open', @CatDrug, 'Drug Peddling', 1, 'District',
    'Manpreet Kaur', '9876500009', @PatialaID, 1, 0, NULL, 1, 0, 3);

INSERT INTO tblInfo (Stamp, CurrentStatus, ComplaintStatus, CategoryID, Category, DepartmentID, Ownership,
    DealerName, DealerMobileNo, JurisdictionID, Status, IsFIR, ParentInfoID, IsPolice, AllotedTo, CompetenceID)
VALUES (DATEADD(DAY, -7, GETDATE()), 'Pending', 'Open', @CatSale, 'Illegal Sale Point', 1, 'HeadQuarter',
    'Kuldeep Singh', '9876500010', @BathindaID, 1, 0, NULL, 0, 0, 4);
GO

-- --------------------------------------------------------------------------
-- 8. Matching audit-trail rows (tblInfoDetail) for the closed complaints
--    above - this is what GetRequestList's "Control Room Remarks" /
--    "District Remarks" columns and the report drill-downs read from.
-- --------------------------------------------------------------------------
INSERT INTO tblInfoDetail (InformationID, Stamp, AllotedTo, AllotedBy, Action, CurrentStatus, Remarks, Status)
SELECT InformationID, Stamp, 0, 0, 'Closed', CurrentStatus,
    CASE CurrentStatus
        WHEN 'Spam' THEN 'Information found incorrect, kindly share more details'
        WHEN 'Incomplete' THEN 'Incomplete Information Please Send Proper Name Address District And Etc.'
        WHEN 'Not Verifiable' THEN 'Information is not verifiable. Kindly share verifiable information'
        WHEN 'Action Taken' THEN 'Incorrect input & ID closed'
    END,
    1
FROM tblInfo
WHERE ComplaintStatus = 'Closed' AND CurrentStatus IN ('Spam', 'Incomplete', 'Not Verifiable', 'Action Taken')
AND InformationID NOT IN (SELECT ISNULL(InformationID, 0) FROM tblInfoDetail);
GO

PRINT 'Sample data inserted. Log in as investigator1 / districthead1 / viewer1 (password Test@1234) after re-running the password migration, or continue testing as testadmin.';
