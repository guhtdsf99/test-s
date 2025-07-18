# visualizations.py

import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter
from io import BytesIO
import config # Correctly imports from config.py

def create_trend_chart(weekly_stats):
    # This function is unchanged
    # weekly_stats = df.set_index('Date').resample('W')[['Clicked', 'Reported']].mean()
    weekly_stats.index = weekly_stats.index.strftime('%yW%U')
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 3.5))
    ax.plot(weekly_stats.index, weekly_stats['Clicked'], marker='o', color=config.ACCENT_RED, label='Click Rate')
    ax.plot(weekly_stats.index, weekly_stats['Reported'], marker='o', color=config.ACCENT_GREEN, label='Reporting Rate')
    ax.yaxis.set_major_formatter(PercentFormatter(1.0))
    ax.grid(axis='y', linestyle='--', alpha=0.6)
    ax.grid(axis='x', linestyle='')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color(config.BORDER_COLOR)
    ax.tick_params(bottom=False, left=False)
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, -0.15), ncol=2, frameon=False)
    plt.tight_layout()
    img_buffer = BytesIO()
    plt.savefig(img_buffer, format='PNG', dpi=300, transparent=True)
    plt.close(fig)
    img_buffer.seek(0)
    return img_buffer

def create_group_assessment_chart(group_stats):
    # This function is unchanged
    # group_stats = df.groupby('Department')[['Clicked', 'Reported']].mean()
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 3.5))
    group_stats.plot(kind='bar', ax=ax, color=[config.ACCENT_RED, config.ACCENT_GREEN])
    ax.yaxis.set_major_formatter(PercentFormatter(1.0))
    ax.grid(axis='y', linestyle='--', alpha=0.6)
    ax.grid(axis='x', linestyle='')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color(config.BORDER_COLOR)
    ax.tick_params(bottom=False, left=False)
    ax.legend(['Click Rate', 'Report Rate'], frameon=False, loc='upper right')
    plt.xticks(rotation=0)
    plt.tight_layout()
    img_buffer = BytesIO()
    plt.savefig(img_buffer, format='PNG', dpi=300, transparent=True)
    plt.close(fig)
    img_buffer.seek(0)
    return img_buffer