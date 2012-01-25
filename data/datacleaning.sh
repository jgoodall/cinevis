#!/bin/sh

# Preprocessing in raw data before running this script
#  * removed extra rows at the end of each sheet
#  * added 'average' row to 2011 sheet
#  * made profitability formula and format consistent throughout sheets


# Clean the csv files
unset years
unset files
for i in `ls *csv` ; do yr=`echo $i | cut -d'.' -f1` ; years="${yr} ${years}" ; file=$yr-clean.csv; files="${file} ${files}" ; cat $i | sed 's/"Film "/"Film"/' | sed 's/"Audience  score %"/"Audience Rating"/' | sed 's/"Rotten Tomatoes %"/"Critic Rating"/' | sed 's/"Number of Theatres in US Opening Weekend"/"Opening Weekend Theaters"/' | sed 's/"Opening Weekend"/"Opening Weekend Revenue"/' | sed 's/"Box Office Average per US Cinema (Opening Weekend)"/"Opening Weekend per Cinema"/' | sed '/^y/d' | sed '/^,,,,,/d' | sed '/% of budget recovered/d' | csvcut -c 2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17 > $file ; done
years=`echo $years | tr ' ' ','`

# Concatenate all files into a single CSV
csvstack -g $years -n Year $files > moviedata.csv

# Pull out averages
csvgrep -c 2 -m Average moviedata.csv | csvjson | jsonlint > moviedata-averages.json

# Check the csv - you should see 'No errors.' on the command line
# A file moviedata_out.csv can be deleted as long as there are no errors
csvclean moviedata.csv

# Remove averages and Convert to JSON
csvgrep -c 2 --invert-match -m Average moviedata.csv | csvjson | jsonlint > moviedata.json
