    /** create a template for the meisterschaft sheet
     * @param   parent  <AMCMain>
     * @param   iClubjahr    <int>
     * @param   bReleaseCom <boolean>
     * @return  Map<String,Integer>
     */
    public static synchronized Map<String,Integer> createTemplate(
            AMCMain parent,
            int iClubjahr,
            boolean bReleaseCom) {
        
        String msg;
        String sFilename = "";
        Vector<clsEvents> vlEvents = null;
        Dispatch application = null;
        int iRow = 1;
        
        Map<String,Integer> alExcelDetails = new HashMap<String,Integer>();
        
        Connection myConn = parent.myConn;
        
        // first read the correct excel file from database
        
        try {
            // events lesen
            vlEvents = getClubEvents(new Integer(-1), iClubjahr, myConn);
            if (vlEvents.size() == 0)
                throw new Exception("Keine Anl�sse vorhanden f�r dieses Jahr");
            
        } catch (Exception e) {
            e.getStackTrace();
            parent.dispErrorMsg(e, "Template erstellen");
            return null;
        }
        
        
        // excel erstellen
        axExcel = new ActiveXComponent("Excel.Application");
        Dispatch.put(axExcel.getObject(), "Visible", new Variant(true));
        try {
            Dispatch workbooks = axExcel.getProperty("Workbooks").toDispatch();
            
            workbook = Dispatch.get(workbooks, "Add").toDispatch();
            
            application = Dispatch.get(workbook, "Application"). toDispatch();
            Dispatch.put(application, "ScreenUpdating", new Variant(false));
            Dispatch.put(application, "DisplayAlerts", new Variant(false));
            Dispatch worksheets = Dispatch.get(workbook,"Sheets").toDispatch();
            Dispatch sheet;
            
            int iCntSheet = Dispatch.get(worksheets, "Count").getInt();
            for (int iSheet = iCntSheet; iSheet > 1; iSheet--) {
                sheet = Dispatch.call(worksheets, "Item", iSheet).toDispatch();
                Dispatch.call(sheet, "Delete");                
            }

            Dispatch.put(application, "DisplayAlerts", new Variant(true));
            
            sheet = Dispatch.get(workbook, "ActiveSheet").toDispatch();
            Dispatch.put(sheet, "Name", "AMC TEMPLATE");
            
            // titel
            iRow++;
            fillRange(sheet, "A"+iRow, "CLUB/KEGELMEISTERSCHAFT", xlFontBold, false);
            // merge columns A2:I2 and align center
            Dispatch range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"A2:I2"},
                    new int[1]).toDispatch();
            Dispatch.put(range, "HorizontalAlignment", xlHAlignCenter);
            Dispatch.put(range, "VerticalAlignment", xlVAlignCenter);
            Dispatch.call(range, "Merge");
            Dispatch font = Dispatch.get(range, "Font").toDispatch();
            Dispatch.put(font, "Size", 12);

            // clubjahr
            iRow += 2;
            fillRange(sheet, "A"+iRow, String.valueOf(iClubjahr), xlFontBold, false);
            // merge columns A4:I4 and align center
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"A4:I4"},
                    new int[1]).toDispatch();
            Dispatch.put(range, "HorizontalAlignment", xlHAlignCenter);
            Dispatch.put(range, "VerticalAlignment", xlVAlignCenter);
            Dispatch.call(range, "Merge");
            font = Dispatch.get(range, "Font").toDispatch();
            Dispatch.put(font, "Size", 12);

            // Name / Vorname
            iRow += 2;
            alExcelDetails.put("N", iRow);
            fillRange(sheet, "B"+iRow, "Name:", xlFontBold, false);
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "C"+iRow, "", xlFontBold, false);
            iRow++;
            alExcelDetails.put("V", iRow);
            fillRange(sheet, "B"+iRow, "Vorname:", 0, false);
            setRowHeight(sheet, iRow, 19.5);

            // kegelmeisterschaft
            iRow += 4;
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "C"+iRow, "Kegelmeisterschaft", xlFontBold, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"C"+iRow+":E"+iRow},
                    new int[1]).toDispatch();
            setBorderAround(range, xlContinuous, xlMedium, xlColorIndexAutomatic);
            iRow++;

            // header kegeln
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "A"+iRow, "Club", 0, true);
            fillRange(sheet, "B"+iRow, "Datum", 0, true);
            fillRange(sheet, "C"+iRow, "Resultate", 0, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"C"+iRow+":G"+iRow},
                    new int[1]).toDispatch();
            Dispatch.put(range, "HorizontalAlignment", xlHAlignCenter);
            Dispatch.put(range, "VerticalAlignment", xlVAlignCenter);
            Dispatch.call(range, "Merge");
            setBorderAround(range, xlContinuous, xlThin, xlColorIndexAutomatic);
            setColumnWidth(sheet, "C:I", 7.29);
            setColumnWidth(sheet, "J", 17.14);

            fillRange(sheet, "H"+iRow, "z Pkt.", 0, true);
            fillRange(sheet, "I"+iRow, "Total", 0, true);
            fillRange(sheet, "J"+iRow, "Visum", 0, true);
            iRow++;

            // detail zeilen kegeln
            SimpleDateFormat sdf = new SimpleDateFormat("dd. MMM");

            for (int iEvent = 0; iEvent < vlEvents.size(); iEvent++) {
                clsEvents event = vlEvents.get(iEvent);
                if (!event.IstKegeln)
                    continue;

                fillRange(sheet, "Z"+iRow, event.eventID.toString(), 0, false);
                alExcelDetails.put(event.eventID.toString(), iRow);
                fillRange(sheet, "C"+iRow, "", 0, true);
                fillRange(sheet, "D"+iRow, "", 0, true);
                fillRange(sheet, "E"+iRow, "", 0, true);
                fillRange(sheet, "F"+iRow, "", 0, true);
                fillRange(sheet, "G"+iRow, "", 0, true);
                fillRange(sheet, "I"+iRow, "", 0, true);
                fillRange(sheet, "J"+iRow, "", 0, true);
                setRowHeight(sheet, iRow, 19.5);

                if (event.Nachkegeln) {
                    fillRange(sheet, "A"+iRow, "", 0, true);
                    fillRange(sheet, "B"+iRow, "Nachkegeln", 0, true);
                    fillRange(sheet, "H"+iRow, "", 0, true);
                } else {
                    fillRange(sheet, "A"+iRow, event.Punkte.toString(), 0, true);
                    fillRange(sheet, "B"+iRow, sdf.format(event.Datum), 0, true);
                    fillRange(sheet, "H"+iRow, "5", 0, true);
                }

                iRow++;
            }

            // total zeile kegeln
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "Z"+iRow, "K", 0, false);
            alExcelDetails.put("K", iRow);
            fillRange(sheet, "F"+iRow, "Total Kegeln", xlFontBold, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"F"+iRow+":H"+iRow},
                    new int[1]).toDispatch();
            setBorderAround(range, xlContinuous, xlMedium, xlColorIndexAutomatic);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"I"+iRow+":I"+iRow},
                    new int[1]).toDispatch();
            String sFormula = "=SUMME(I13:I" + (iRow-1) + ")";
            Dispatch.put(range, "Formula", sFormula);
            setBorderAround(range, xlContinuous, xlMedium, xlColorIndexAutomatic);

            iRow++;

            //Clubmeisterschaft
            iRow++;
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "C"+iRow, "Clubmeisterschaft", xlFontBold, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"C"+iRow+":E"+iRow},
                    new int[1]).toDispatch();
            setBorderAround(range, xlContinuous, xlMedium, xlColorIndexAutomatic);

            // header club
            iRow++;
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "A"+iRow, "Club", 0, true);
            fillRange(sheet, "B"+iRow, "Datum", 0, true);

            // detail zeilen club
            iRow++;
            for (int iEvent = 0; iEvent < vlEvents.size(); iEvent++) {
                clsEvents event = vlEvents.get(iEvent);
                if (event.IstKegeln)
                    continue;

                setRowHeight(sheet, iRow, 19.5);
                fillRange(sheet, "Z"+iRow, event.eventID.toString(), 0, false);
                alExcelDetails.put(event.eventID.toString(), iRow);
                fillRange(sheet, "A"+iRow, event.Punkte.toString(), 0, true);
                fillRange(sheet, "B"+iRow, sdf.format(event.Datum), 0, true);
                fillRange(sheet, "C"+iRow, event.Name, 0, false);
                range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                        new Object[] {"C"+iRow+":I"+iRow},
                        new int[1]).toDispatch();
                setBorderAround(range, xlContinuous, xlThin, xlColorIndexAutomatic);

                iRow++;
            }

            // zeile Mitgliederwerbung
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "Z"+iRow, "M", 0, false);
            alExcelDetails.put("M", iRow);
            fillRange(sheet, "A"+iRow, "50", 0, true);
            fillRange(sheet, "B"+iRow, "", 0, true);
            fillRange(sheet, "C"+iRow, "Mitgliederwerbung", 0, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"C"+iRow+":I"+iRow},
                    new int[1]).toDispatch();
            setBorderAround(range, xlContinuous, xlThin, xlColorIndexAutomatic);
            iRow++;
            // zeile SAM-Sportveranstaltung
            setRowHeight(sheet, iRow, 19.5);
            fillRange(sheet, "Z"+iRow, "S", 0, false);
            alExcelDetails.put("S", iRow);
            fillRange(sheet, "A"+iRow, "50", 0, true);
            fillRange(sheet, "B"+iRow, "", 0, true);
            fillRange(sheet, "C"+iRow, "SAM-Sportveranstaltung", 0, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"C"+iRow+":I"+iRow},
                    new int[1]).toDispatch();
            setBorderAround(range, xlContinuous, xlThin, xlColorIndexAutomatic);
            iRow++;

            // total zeile club
            setRowHeight(sheet, iRow, 19.5);
            sFormula = "=SUMME(A13:A" + (iRow - 1) + ")";
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"A"+iRow},
                    new int[1]).toDispatch();
            Dispatch.put(range, "Formula", sFormula);
            setBorderAround(range, xlContinuous, xlMedium, xlColorIndexAutomatic);

            fillRange(sheet, "B"+iRow, "Total Club", xlFontBold, false);
            range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                    new Object[] {"B"+iRow},
                    new int[1]).toDispatch();
            setBorderAround(range, xlContinuous, xlMedium, xlColorIndexAutomatic);
            iRow++;

            // page setup setzten
            Dispatch pageSetup = Dispatch.get(sheet, "PageSetup").toDispatch();
            Dispatch.put(pageSetup, "PrintTitleRows", "");
            Dispatch.put(pageSetup, "PrintTitleColumns", "");
            Dispatch.put(pageSetup, "LeftMargin", 40);
            Dispatch.put(pageSetup, "RightMargin", 40);
            Dispatch.put(pageSetup, "TopMargin", 38);
            Dispatch.put(pageSetup, "BottomMargin", 40);
            Dispatch.put(pageSetup, "HeaderMargin", 26);
            Dispatch.put(pageSetup, "FooterMargin", 26);
            Dispatch.put(pageSetup, "PrintHeadings", 0);
            Dispatch.put(pageSetup, "PrintGridlines", 0);
            Dispatch.put(pageSetup, "CenterHorizontally", 1);
            Dispatch.put(pageSetup, "CenterVertically", 0);
            Dispatch.put(pageSetup, "Orientation", xlPortrait);
            Dispatch.put(pageSetup, "Draft", 0);
            Dispatch.put(pageSetup, "PaperSize", xlPaperA4);
            Dispatch.put(pageSetup, "FirstPageNumber", xlAutomatic);
            Dispatch.put(pageSetup, "Order", xlDownThenOver);
            Dispatch.put(pageSetup, "BlackAndWhite", 0);
            Dispatch.put(pageSetup, "FitToPagesWide", 1);
            Dispatch.put(pageSetup, "FitToPagesTall", 1);
            Dispatch.put(pageSetup, "RightHeader",  "&\"Arial,Fett\"&12Auto-Moto-Club Swissair");
            Dispatch.put(pageSetup, "PrintArea",  "A1:J"+iRow);
            Dispatch.put(pageSetup, "Zoom", new Variant(false));
            Dispatch.put(application, "ScreenUpdating", new Variant(true));

        } catch (Exception e) {
//            axExcel.invoke("Quit", new Variant[] {});
            Dispatch.put(application, "ScreenUpdating", new Variant(true));
            
            e.getStackTrace();
            parent.dispErrorMsg(e, "Template erstellen");
            return null;
        }
        
        if (bReleaseCom)
            ComThread.Release();
        
        return alExcelDetails;
    }

    /** @param  bEmpty <boolean>    if true: no values in
     *  @param  address <Vector<clsAddress>>    List of address records
     *  @return boolean true, if successful
     */
    public static synchronized boolean createStammblatt(
            AMCMain parent,
            boolean bEmpty,
            Vector<clsAddress> address,
            int iClubjahr) {
        boolean bRetValue = true;
        String msg;
        
        Connection myConn = parent.myConn;
        
        Map<String,Integer> alExcelDetails = new HashMap<String,Integer>();
        
        alExcelDetails = createTemplate(parent, iClubjahr, false);
        if (alExcelDetails == null)
            return false;
        
        try {
            Dispatch workbooks = axExcel.getProperty("Workbooks").toDispatch();
            
            Dispatch tmpSheet = Dispatch.get(workbook,"ActiveSheet").toDispatch();
            
            if (!bEmpty) {
                // empty the additional 5 points in the template sheet
                // they will be refilled when necessary
                String range = "H" + (alExcelDetails.get("V")+6) + ":H" + (alExcelDetails.get("K")-1);
                fillRange(tmpSheet, range, "", 0, false);
            }
            
            Dispatch sheet = null;
            
            for (int iAdr = 0; iAdr < address.size(); iAdr++) {
                clsAddress updAddress = address.get(iAdr);
                
                Map<String,Integer[]> alResults = new HashMap<String,Integer[]>();
                
                if (!bEmpty) {
                    // get the results
                    Integer iTotalPoints = 0;
                    
                    Vector<clsEvents> vRes = getClubEvents(
                            updAddress.MNR, iClubjahr, myConn);
                    
                    for (int i = 0; i < vRes.size(); i++) {
                        clsEvents event = vRes.get(i);
                        iTotalPoints += event.Punkte;
                        String sKey = event.eventID.toString();
                        Integer[] aiWurf = new Integer[] {
                            event.Punkte
                                    , event.Wurf1
                                    , event.Wurf2
                                    , event.Wurf3
                                    , event.Wurf4
                                    , event.Wurf5
                                    , (event.Nachkegeln ? 1 : 0)
                                    , event.Streichresultat
                        };
                        
                        alResults.put(sKey, aiWurf);
                    }
                    
                    Vector<clsAddress> member = getMemberRecruitments(
                            updAddress.MNR, iClubjahr, myConn);
                    
                    Integer[] aiResult = new Integer[] {member.size()*50};
                    iTotalPoints += aiResult[0];
                    alResults.put("M", aiResult);
                    
                    vRes = getSAMEventsResults(
                            updAddress.MNR, iClubjahr, myConn);
                    
                    aiResult = new Integer[] {vRes.size()*50};
                    iTotalPoints += aiResult[0];
                    alResults.put("S", aiResult);
                
                    if (iTotalPoints == 0)
                        continue;
                }
                                
                Dispatch.call(tmpSheet, "Copy", new Variant(tmpSheet));                    
                sheet = Dispatch.get(workbook,"ActiveSheet").toDispatch();
                
                Dispatch.put(sheet, "Name", updAddress.vorname + " " + updAddress.name);
                
                fillRange(sheet, "C" + alExcelDetails.get("N"), updAddress.name, xlFontBold, false);
                fillRange(sheet, "C" + alExcelDetails.get("V"), updAddress.vorname, 0, false);
                
                Integer iRowK = alExcelDetails.get("K");
                Integer iRowM = alExcelDetails.get("M");
                Integer iRowS = alExcelDetails.get("S");
                
                
                if (!bEmpty) {                    
                    // fill the excel file
                    for (Map.Entry<String, Integer> me : alExcelDetails.entrySet()) {
                        String sKey = me.getKey();
                        if (sKey.compareTo("K") == 0 ||
                            sKey.compareTo("N") == 0 ||
                            sKey.compareTo("V") == 0)
                            continue;
                        
                        Integer iRow = me.getValue();
                        
                        Integer[] iRes = alResults.get(sKey);
                        
                        Dispatch range;
                        
                        String sRange = "A" + iRow;
                        Integer iPoints = (iRes == null ? new Integer(0) : iRes[0]);
                        fillRange(sheet, sRange, iPoints.toString(), 0, false);
                        
                        // if kegeln
                        if (iRow < iRowK && iRes != null) {
                            int iTotal = 0;
                            int iFontStyle = 0;
                            
                            sRange = "C" + iRow;
                            fillRange(sheet, sRange, iRes[1].toString(), iFontStyle, false);
                            iTotal += iRes[1];
                            sRange = "D" + iRow;
                            fillRange(sheet, sRange, iRes[2].toString(), iFontStyle, false);
                            iTotal += iRes[2];
                            sRange = "E" + iRow;
                            fillRange(sheet, sRange, iRes[3].toString(), iFontStyle, false);
                            iTotal += iRes[3];
                            sRange = "F" + iRow;
                            fillRange(sheet, sRange, iRes[4].toString(), iFontStyle, false);
                            iTotal += iRes[4];
                            sRange = "G" + iRow;
                            fillRange(sheet, sRange, iRes[5].toString(), iFontStyle, false);
                            iTotal += iRes[5];
                            
                            sRange = "H" + iRow;
                            if (iRes[6] == 0 && iTotal > 0) {
                                fillRange(sheet, sRange, "5", iFontStyle, false);
                                iTotal += 5;
                            } else {
                                fillRange(sheet, sRange, "", iFontStyle, false);
                            }
                            
                            if (iTotal > 0 && iRes[7] == 0) {
                                sRange = "I" + iRow;
                                range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                                        new Object[] {sRange},
                                        new int[1]).toDispatch();
                                String sFormula = "=SUMME(C" + iRow + ":H" + iRow + ")";
                                Dispatch.put(range, "Formula", sFormula);
                            }
                            if (iRes[7] == 1) {
                                // change format
                                sRange = "C" + iRow + ":H" + iRow;
                                range = Dispatch.invoke(sheet, "Range", Dispatch.Get,
                                        new Object[] {sRange},
                                        new int[1]).toDispatch();
                                        
                                Dispatch border = Dispatch.invoke(range, "Borders", Dispatch.Get,
                                        new Object[] {xlDiagonalUp},
                                        new int[1]).toDispatch();
                                Dispatch.put(border, "LineStyle", xlContinuous);
                                Dispatch.put(border, "Weight", xlThin);
                                Dispatch.put(border, "ColorIndex", xlColorIndexAutomatic);
                            }
                        }
                    }
                }
            }
            
            Dispatch application = Dispatch.get(workbook, "Application"). toDispatch();
            Dispatch.put(application, "DisplayAlerts", new Variant(false));
            Dispatch worksheets = Dispatch.get(workbook,"Sheets").toDispatch();
            sheet = Dispatch.call(worksheets, "Item", "AMC TEMPLATE").toDispatch();
            Dispatch.call(sheet, "Delete");
            Dispatch.put(application, "DisplayAlerts", new Variant(true));
            sheet = Dispatch.call(worksheets, "Item", 1).toDispatch();
            Dispatch.call(sheet, "Select");
            
        } catch (Exception e) {
            e.printStackTrace();
            axExcel.invoke("Quit", new Variant[] {});
            parent.dispErrorMsg(e, "Stammblatt erstellen");
            bRetValue = false;
        }
        
        ComThread.Release();
        
        axExcel = null;
        workbook = null;
        
        return bRetValue;
    }

