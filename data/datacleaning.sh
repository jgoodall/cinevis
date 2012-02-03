#!/bin/sh

# Preprocessing in raw data before running this script
#  * removed extra rows at the end of each sheet
#  * added 'average' row to 2011 sheet
#  * made profitability formula and format consistent throughout sheets - format needs to remove the comma separator (and made to 4 decimal places)
#  * made formatting the same across sheets for numbers
#  * removed columns after oscars after pasting in values for calculations
#  * Fixed story for 'crank: high voltage' - weird formatting
#  * excluded 'Hugo' b/c no data
#  * ecluded other films b/c ? in one of the columns


# Clean the csv files
unset years
unset files
for i in `ls *csv` ; do yr=`echo $i | cut -d'.' -f1` ; years="${yr} ${years}" ; file=$yr-clean.csv; files="${file} ${files}" ; cat $i | sed 's/,Film ,/,Film,/' | sed 's/,Audience  score %,/,Audience Rating,/' | sed 's/,Rotten Tomatoes %,/,Critic Rating,/' | sed 's/,Number of Theatres in US Opening Weekend,/,Opening Weekend Theaters,/' | sed 's/,Opening Weekend,/,Opening Weekend Revenue,/' | sed 's/,Box Office Average per US Cinema (Opening Weekend),/,Opening Weekend per Cinema,/' | sed '/^y/d' | sed '/^,,,,,/d' | sed '/% of budget recovered/d' | sed 's/ ,/,/' | tr -d '\015' > $file ; done
years=`echo $years | tr ' ' ','`

# Concatenate all files into a single CSV
csvstack -g $years -n Year $files > moviedata.csv

# Pull out averages
csvgrep -c 3 -m Average moviedata.csv | csvjson | jsonlint > moviedata-averages.json

# Remove averages and Convert to JSON
csvgrep -c 3 --invert-match -m Average moviedata.csv | csvjson | jsonlint > moviedata.json
