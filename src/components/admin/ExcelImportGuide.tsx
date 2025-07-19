import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ExcelImportGuide: React.FC = () => {
    return (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    Excel Import Format Guide
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Your Excel file should have the following columns in the first row as headers. Column names must match exactly.
                    </AlertDescription>
                </Alert>

                <div className="overflow-x-auto">
                    <Table className="text-sm">
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold text-gray-900">first_name</TableHead>
                                <TableHead className="font-semibold text-gray-900">last_name</TableHead>
                                <TableHead className="font-semibold text-gray-900">email</TableHead>
                                <TableHead className="font-semibold text-gray-900">username</TableHead>
                                <TableHead className="font-semibold text-gray-900">department</TableHead>
                                <TableHead className="font-semibold text-gray-900">role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>John</TableCell>
                                <TableCell>Doe</TableCell>
                                <TableCell>john@example.com</TableCell>
                                <TableCell>johndoe</TableCell>
                                <TableCell>IT</TableCell>
                                <TableCell>USER</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Jane</TableCell>
                                <TableCell>Smith</TableCell>
                                <TableCell>jane@example.com</TableCell>
                                <TableCell>janesmith</TableCell>
                                <TableCell>HR</TableCell>
                                <TableCell>COMPANY_ADMIN</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Required Columns:</h4>
                        <ul className="space-y-1 text-gray-600">
                            <li>• <code className="bg-gray-100 px-1 rounded">first_name</code> - User's first name</li>
                            <li>• <code className="bg-gray-100 px-1 rounded">last_name</code> - User's last name</li>
                            <li>• <code className="bg-gray-100 px-1 rounded">email</code> - User's email address</li>
                            <li>• <code className="bg-gray-100 px-1 rounded">role</code> - USER or COMPANY_ADMIN</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Optional Columns:</h4>
                        <ul className="space-y-1 text-gray-600">
                            <li>• <code className="bg-gray-100 px-1 rounded">username</code> - Auto-generated if empty</li>
                            <li>• <code className="bg-gray-100 px-1 rounded">department</code> - Group name </li>
                        </ul>
                    </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Note:</strong> Make sure column names match exactly as shown above (case-sensitive).
                    Supported file formats: .xlsx, .xls, .csv
                </div>
            </CardContent>
        </Card>
    );
};

export default ExcelImportGuide;