# data_processing.py

import pandas as pd
import numpy as np
import random
import json
import os

def generate_dummy_data():
    """Generates dummy data and ensures at least one repeat clicker exists."""
    n = random.randint(1,8)
    all_dates = pd.date_range(start=f"2025-0{n}-01", end=f"2025-0{n+1}-30", freq='D')
    random_dates_dt = np.random.choice(all_dates, size=36, replace=False)
    random_dates_dt.sort()
    random_dates_list = pd.to_datetime(random_dates_dt).strftime('%Y-%m-%d').tolist()

    # We will use a smaller, fixed pool of names to increase chances of repeats
    user_names = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi"]
    # --- MODIFICATION: Changed department list to match example ---
    departments = ["HR", "Finance", "Sales", "IT"]

    data = {
        "ID": range(1, 37),
        "Name": random.choices(user_names, k=36),
        "Department": random.choices(departments, k=36),
        "Clicked": random.choices([True, False], weights=[0.3, 0.7], k=36),
        "Reported": random.choices([True, False], weights=[0.6, 0.4], k=36),
        "Date": random_dates_list,
        "Campaign_ID": random.choices(range(1, 6), k=36)
    }
    df = pd.DataFrame(data)
    df['Date'] = pd.to_datetime(df['Date'])

    # --- Engineer a repeat clicker ---
    # Find the user who received the most emails to be our candidate
    candidate_name = df['Name'].value_counts().idxmax()
    candidate_indices = df[df['Name'] == candidate_name].index

    # Ensure this user has at least two clicks
    if len(candidate_indices) >= 2:
        df.loc[candidate_indices[0], 'Clicked'] = True
        df.loc[candidate_indices[1], 'Clicked'] = True
        # To make it interesting, maybe they reported one but not the other
        df.loc[candidate_indices[0], 'Reported'] = True
        df.loc[candidate_indices[1], 'Reported'] = False
        # df.to_json("Data/data.json", orient='records', indent=4, date_format='iso')

    return df

def calculate_kpis(df):
    """Calculates KPIs, now including the number of repeat clickers."""
    kpis = {}
    kpis['total_emails'] = len(df)
    kpis['total_campaigns'] = df['Campaign_ID'].nunique()
    kpis['avg_click_rate'] = df['Clicked'].mean()
    kpis['avg_report_rate'] = df['Reported'].mean()

    # --- New KPI Calculation ---
    clicked_df = df[df['Clicked'] == True]
    click_counts_by_user = clicked_df.groupby('Name').size()
    repeat_clickers_series = click_counts_by_user[click_counts_by_user > 1]
    kpis['repeat_clickers'] = len(repeat_clickers_series)
    # --- End New KPI ---

    group_stats = df.groupby('Department')[['Clicked', 'Reported']].mean()
    vulnerable_group = group_stats['Clicked'].idxmax()
    kpis['most_vulnerable_group_name'] = vulnerable_group
    kpis['most_vulnerable_group_click_rate'] = group_stats.loc[vulnerable_group, 'Clicked']
    effective_group = group_stats['Reported'].idxmax()
    kpis['most_effective_group_name'] = effective_group
    kpis['most_effective_group_report_rate'] = group_stats.loc[effective_group, 'Reported']
    return kpis

def calculate_departmental_stats(df):
    """Calculates detailed stats per department for the breakdown table."""
    # Get a sorted list of all departments to ensure consistent order
    all_departments = sorted(df['Department'].unique())
    
    # Calculate counts (Emails Sent)
    emails_sent = df.groupby('Department').size().rename('Emails Sent')
    
    # Calculate rates (Click Rate, Report Rate)
    rates = df.groupby('Department')[['Clicked', 'Reported']].mean()
    rates.rename(columns={'Clicked': 'Click Rate', 'Reported': 'Report Rate'}, inplace=True)
    
    # Combine the stats into a single DataFrame and ensure all departments are present
    department_stats_df = pd.concat([emails_sent, rates], axis=1).reindex(all_departments).fillna(0)
    
    return department_stats_df

def create_data_dict():
    df = generate_dummy_data()
    kpis = calculate_kpis(df)
    dep_stats = calculate_departmental_stats(df)
    dict_ = dep_stats.to_dict()
    kpis["dep_stats"] = dict_
    weekly_stats = df.set_index('Date').resample('W')[['Clicked', 'Reported']].mean()
    weekly_stats.index = weekly_stats.index.map(pd.Timestamp.isoformat)
    # weekly_stats.index = weekly_stats.index.strftime('%yW%U')
    kpis["weekly_stats"] = weekly_stats.to_dict()
    kpis["group_stats"] = df.groupby('Department')[['Clicked', 'Reported']].mean().to_dict()

    start_date_obj = df['Date'].min()
    end_date_obj = df['Date'].max()
    report_start_date = start_date_obj.strftime("%B %d, %Y") # e.g., "May 03, 2025"
    report_end_date = end_date_obj.strftime("%B %d, %Y")   # e.g., "June 28, 2025"
    kpis["start_date"] = report_start_date
    kpis["end_date"] = report_end_date
    kpis["org_name"] = "Compumacy"
    
    filename = "Data/data.json"
    
    try:
        # Attempt to remove the file
        os.remove(filename)
        # print(f"Successfully removed existing file: {filename}")
    except FileNotFoundError:
        pass
        # If the file doesn't exist, that's fine. Do nothing.
        # print(f"File not found, will create a new one: {filename}")
    except Exception as e:
        # Handle other potential errors, like permission errors
        print(f"Error removing file: {e}")
    
    with open(filename, 'w') as f:
        json.dump(kpis, f, indent=4)
    print(f"Created {filename}")


if __name__ == '__main__':
    create_data_dict()