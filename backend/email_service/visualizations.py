import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter
from io import BytesIO
import pandas as pd

# Configuration constants - matching original system
BRAND_COLOR = '#364b82'  # Brand blue
ACCENT_RED = '#E63946'   # Red for click rates
ACCENT_GREEN = '#2A9D8F' # Green for report rates
BORDER_COLOR = '#DDDDDD' # Light gray for borders
TEXT_COLOR_DARK = '#222222'
TEXT_COLOR_LIGHT = '#666666'


def create_trend_chart(weekly_stats_dict):
    """Create trend chart from weekly statistics dictionary"""
    # Convert dictionary to DataFrame
    weekly_df = pd.DataFrame(weekly_stats_dict)
    weekly_df.index = pd.to_datetime(weekly_df.index)
    
    # Format index for display
    weekly_df.index = weekly_df.index.strftime('%yW%U')
    
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 3.5))
    
    ax.plot(weekly_df.index, weekly_df['Clicked'], marker='o', color=ACCENT_RED, label='Click Rate')
    ax.plot(weekly_df.index, weekly_df['Reported'], marker='o', color=ACCENT_GREEN, label='Reporting Rate')
    
    ax.yaxis.set_major_formatter(PercentFormatter(1.0))
    ax.grid(axis='y', linestyle='--', alpha=0.6)
    ax.grid(axis='x', linestyle='')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color(BORDER_COLOR)
    ax.tick_params(bottom=False, left=False)
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.15), ncol=2, frameon=False)
    
    plt.tight_layout()
    img_buffer = BytesIO()
    plt.savefig(img_buffer, format='PNG', dpi=300, transparent=True)
    plt.close(fig)
    img_buffer.seek(0)
    return img_buffer


def create_group_assessment_chart(group_stats_dict):
    """Create group assessment chart from group statistics dictionary"""
    # Convert dictionary to DataFrame
    group_df = pd.DataFrame(group_stats_dict)
    
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 3.5))
    
    group_df.plot(kind='bar', ax=ax, color=[ACCENT_RED, ACCENT_GREEN])
    
    ax.yaxis.set_major_formatter(PercentFormatter(1.0))
    ax.grid(axis='y', linestyle='--', alpha=0.6)
    ax.grid(axis='x', linestyle='')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color(BORDER_COLOR)
    ax.tick_params(bottom=False, left=False)
    ax.legend(['Click Rate', 'Report Rate'], frameon=False, loc='upper right')
    
    plt.xticks(rotation=0)
    plt.tight_layout()
    img_buffer = BytesIO()
    plt.savefig(img_buffer, format='PNG', dpi=300, transparent=True)
    plt.close(fig)
    img_buffer.seek(0)
    return img_buffer