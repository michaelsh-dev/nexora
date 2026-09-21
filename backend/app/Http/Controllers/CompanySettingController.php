<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;

class CompanySettingController extends Controller
{
    public function show()
    {
        $setting = CompanySetting::first();

        if (!$setting) {
            $setting = CompanySetting::create([
                'company_name' => 'Nexora',
                'currency' => 'IDR',
                'timezone' => 'Asia/Jakarta',
            ]);
        }

        return response()->json($setting);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'address' => [
                'nullable',
                'string',
            ],

            'tax_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'website' => [
                'nullable',
                'string',
                'max:255',
            ],

            'currency' => [
                'required',
                'string',
                'max:10',
            ],

            'timezone' => [
                'required',
                'string',
                'max:100',
            ],
        ]);

        $setting = CompanySetting::first();

        if (!$setting) {
            $setting = CompanySetting::create($validated);
        } else {
            $setting->update($validated);
        }

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan.',
            'data' => $setting,
        ]);
    }
}