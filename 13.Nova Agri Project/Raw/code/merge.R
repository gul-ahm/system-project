library(tidyverse)






assign_unique_ids <- function(data, particular_col = "Particulars") {
  # Load required libraries
  if (!requireNamespace("dplyr", quietly = TRUE)) install.packages("dplyr")
  if (!requireNamespace("stringr", quietly = TRUE)) install.packages("stringr")
  
  library(dplyr)
  library(stringr)
  
  data %>%
    # Step 1: Normalize the 'Particulars' for consistent matching
    mutate(normalized_particular = str_to_lower(!!sym(particular_col)) %>%
             str_replace_all("[^a-z0-9]", "")) %>%
    # Step 2: Group by the normalized name and assign unique ID
    group_by(normalized_particular) %>%
    mutate(particular_id = cur_group_id()) %>%
    ungroup() %>%
    # Step 3: Remove the normalized helper column
    select(-normalized_particular)
}







credit_notes <- read_csv("C:/Users/arubh/Downloads/Credit_Notes_18_24_With_Tax_Amount.csv")
reciepts <- read_csv("C:/Users/arubh/Downloads/Receipts_2018_to_2024.csv")



library(dplyr)
library(stringr)

# 1. Combine all unique "Particulars"
all_particulars <- bind_rows(
  credit_notes %>% select(Particulars),
  reciepts %>% select(Particulars)
) %>%
  distinct() %>%
  mutate(
    normalized = Particulars %>%
      str_to_lower() %>%
      str_replace_all("[^a-z0-9]", "")
  ) %>%
  distinct(normalized, .keep_all = TRUE) %>%
  mutate(particular_id = row_number())  # or use cur_group_id if grouping

# 2. Create dictionary
particular_dict <- all_particulars %>%
  select(Particulars, normalized, particular_id)


particular_dict %>% filter(particular_id == 77)


  # credit_notes with ID
credit_notes <- credit_notes %>%
  mutate(normalized = str_to_lower(Particulars) %>%
           str_replace_all("[^a-z0-9]", "")) %>%
  left_join(particular_dict, by = "normalized") %>%
  select(-normalized)

# reciepts with ID
reciepts <- reciepts %>%
  mutate(normalized = str_to_lower(Particulars) %>%
           str_replace_all("[^a-z0-9]", "")) %>%
  left_join(particular_dict, by = "normalized") %>%
  select(-normalized)



cn = credit_notes %>% group_by(particular_id) %>% 
  summarise(sum_cr = sum(`Gross Total`))

rec = reciepts %>% group_by(particular_id) %>% 
  summarise(sum_reciepts = sum(Credit))


sales_reg <- read_csv("E:/agri_credit/sales_register.csv")


sales_reg <- sales_reg %>%
  mutate(normalized = str_to_lower(Particulars) %>%
           str_replace_all("[^a-z0-9]", "")) %>%
  left_join(particular_dict, by = "normalized") %>%
  select(-normalized)




library(dplyr)
library(lubridate)

# Make sure dates are in Date format
credit_notes$Date <- as.Date(credit_notes$Date)
reciepts$Date <- as.Date(reciepts$Date, "%d-%m-%y")


# Get monthly sales
sales_df <- sales_reg %>%
  mutate(sale_month = as.Date(paste(YEAR, MONTH, "01", sep = "-"))) %>%
  group_by(particular_id, sale_month) %>%
  summarise(sales_value = sum(sum_value, na.rm = TRUE), .groups = "drop")

# Get monthly credit notes
credit_df <- credit_notes %>%
  mutate(sale_month = floor_date(Date, unit = "month")) %>%
  group_by(particular_id, sale_month) %>%
  summarise(credit_value = sum(Value, na.rm = TRUE), .groups = "drop")

# Net sales
net_sales <- sales_df %>%
  left_join(credit_df, by = c("particular_id", "sale_month")) %>%
  mutate(net_sales = sales_value - coalesce(credit_value, 0))



# Prepare receipts
receipt_df <- reciepts %>%
  mutate(receipt_month = floor_date(Date, unit = "month")) %>%
  group_by(particular_id, receipt_month) %>%
  summarise(receipt_value = sum(Credit, na.rm = TRUE), .groups = "drop")

# All combinations of net sales and receipts
sales_receipts <- net_sales %>%
  inner_join(receipt_df, by = "particular_id") %>%
  filter(receipt_month >= sale_month) %>%  # only consider receipts after sales
  mutate(
    delay_days = as.numeric(difftime(receipt_month, sale_month, units = "days")),
    delay_months = delay_days / 30,
    delayed_flag = ifelse(delay_days > 180, 1, 0)
  )


payment_summary <- sales_receipts %>%
  group_by(particular_id) %>%
  summarise(
    total_net_sales = sum(net_sales, na.rm = TRUE),
    total_receipts = sum(receipt_value, na.rm = TRUE),
    payment_ratio = total_receipts / total_net_sales,
    avg_delay_days = weighted.mean(delay_days, receipt_value, na.rm = TRUE),
    avg_delay_months = avg_delay_days / 30,
    delayed = ifelse(avg_delay_days > 180, 1, 0)
  )




payment_summary = payment_summary %>% mutate(Delayed_Super = ifelse(avg_delay_days > 250, 1,0))

score_creditworthiness <- function(df) {
  df %>%
    mutate(
      # Normalize payment_ratio between 0 and 1
      norm_payment = pmin(payment_ratio, 1),  # cap at 1
      
      # Normalize delay: assuming 0 = best, 180 = worst reasonable threshold
      norm_delay = 1 - pmin(avg_delay_days, 180) / 180,  # scaled to 0–1, inverse
      
      # Normalize delayed: 1 if delayed, 0 if not → invert it
      norm_flag = ifelse(delayed == 1, 0, 1),
      
      # Weighted score between 0–1
      credit_score_norm = 0.5 * norm_payment + 0.3 * norm_delay + 0.2 * norm_flag,
      
      # Scale to 100–900 range
      credit_score = round(100 + credit_score_norm * 800)
    ) %>%
    arrange(desc(credit_score))
}


payment_summary <- score_creditworthiness(payment_summary)

payment_summary %>% View()




# dfododod ----------------------------------------------------------------

library(dplyr)
library(lubridate)

# Comprehensive Credit Scoring Function
advanced_credit_scoring <- function(sales_reg, credit_notes, reciepts) {
  # Ensure date formats
  credit_notes$Date <- as.Date(credit_notes$Date)
  reciepts$Date <- as.Date(reciepts$Date, "%d-%m-%y")
  
  # Monthly Sales Computation
  sales_df <- sales_reg %>%
    mutate(sale_month = as.Date(paste(YEAR, MONTH, "01", sep = "-"))) %>%
    group_by(particular_id, sale_month) %>%
    summarise(
      sales_value = sum(sum_value, na.rm = TRUE),
      sales_count = n(),
      .groups = "drop"
    )
  
  # Monthly Credit Notes
  credit_df <- credit_notes %>%
    mutate(sale_month = floor_date(Date, unit = "month")) %>%
    group_by(particular_id, sale_month) %>%
    summarise(
      credit_value = sum(Value, na.rm = TRUE),
      credit_count = n(),
      .groups = "drop"
    )
  
  # Net Sales Computation
  net_sales <- sales_df %>%
    left_join(credit_df, by = c("particular_id", "sale_month")) %>%
    mutate(
      net_sales = sales_value - coalesce(credit_value, 0),
      credit_ratio = coalesce(credit_value, 0) / sales_value
    )
  
  # Receipts Preparation
  receipt_df <- reciepts %>%
    mutate(receipt_month = floor_date(Date, unit = "month")) %>%
    group_by(particular_id, receipt_month) %>%
    summarise(
      receipt_value = sum(Credit, na.rm = TRUE),
      receipt_count = n(),
      .groups = "drop"
    )
  
  # Sales and Receipts Matching
  sales_receipts <- net_sales %>%
    inner_join(receipt_df, by = "particular_id") %>%
    filter(receipt_month >= sale_month) %>%
    mutate(
      delay_days = as.numeric(difftime(receipt_month, sale_month, units = "days")),
      delay_months = delay_days / 30,
      delayed_flag = ifelse(delay_days > 180, 1, 0)
    )
  
  # Payment Summary with Multiple Indicators
  payment_summary <- sales_receipts %>%
    group_by(particular_id) %>%
    summarise(
      # Basic Financial Metrics
      total_net_sales = sum(net_sales, na.rm = TRUE),
      total_receipts = sum(receipt_value, na.rm = TRUE),
      total_sales_count = sum(sales_count, na.rm = TRUE),
      total_receipt_count = sum(receipt_count, na.rm = TRUE),
      
      # Payment and Credit Metrics
      payment_ratio = total_receipts / total_net_sales,
      credit_ratio = sum(credit_value, na.rm = TRUE) / total_net_sales,
      
      # Delay Metrics
      avg_delay_days = weighted.mean(delay_days, receipt_value, na.rm = TRUE),
      avg_delay_months = avg_delay_days / 30,
      delayed_count = sum(delayed_flag, na.rm = TRUE),
      
      # Variability Metrics
      sales_variability = sd(net_sales, na.rm = TRUE) / mean(net_sales, na.rm = TRUE),
      receipt_variability = sd(receipt_value, na.rm = TRUE) / mean(receipt_value, na.rm = TRUE),
      
      .groups = "drop"
    ) %>%
    mutate(
      # Additional Delay Flags
      delayed = ifelse(avg_delay_days > 180, 1, 0),
      delayed_super = ifelse(avg_delay_days > 250, 1, 0)
    )
  
  # Advanced Credit Scoring Function
  advanced_score_creditworthiness <- function(df) {
    df %>%
      mutate(
        # Normalize payment ratio
        norm_payment = pmin(payment_ratio, 1),
        
        # Normalize delay (inverse)
        norm_delay = 1 - pmin(avg_delay_days, 180) / 180,
        
        # Normalize sales consistency
        norm_sales_consistency = 1 - pmin(sales_variability, 1),
        
        # Normalize receipt consistency
        norm_receipt_consistency = 1 - pmin(receipt_variability, 1),
        
        # Delay penalty
        delay_penalty = case_when(
          delayed_super == 1 ~ 0.3,
          delayed == 1 ~ 0.15,
          TRUE ~ 0
        ),
        
        # Credit ratio penalty
        credit_penalty = pmin(credit_ratio * 0.5, 0.2),
        
        # Comprehensive Credit Score Calculation
        credit_score_raw = 
          0.4 * norm_payment + 
          0.2 * norm_delay + 
          0.15 * norm_sales_consistency + 
          0.15 * norm_receipt_consistency -
          delay_penalty - 
          credit_penalty,
        
        # Scale to 100-900 range with adjustments
        credit_score = pmax(pmin(
          round(100 + credit_score_raw * 800), 
          900  # Maximum score
        ), 100),  # Minimum score
        
        # Risk Categories
        risk_category = cut(
          credit_score, 
          breaks = c(0, 300, 500, 650, 750, 900),
          labels = c("High Risk", "Moderate-High Risk", "Moderate", "Low-Moderate Risk", "Low Risk"),
          include.lowest = TRUE
        )
      ) %>%
      arrange(desc(credit_score))
  }
  
  # Apply Advanced Credit Scoring
  final_credit_summary <- advanced_score_creditworthiness(payment_summary)
  
  # Return comprehensive results
  return(list(
    sales_data = sales_df,
    credit_data = credit_df,
    net_sales = net_sales,
    receipts_data = receipt_df,
    payment_summary = final_credit_summary
  ))
}

# Function to generate detailed credit report
generate_credit_report <- function(credit_scoring_result) {
  report <- credit_scoring_result$payment_summary %>%
    select(
      particular_id, 
      total_net_sales, 
      total_receipts, 
      payment_ratio, 
      avg_delay_days, 
      credit_score, 
      risk_category
    )
  
  return(report)
}

# Example usage
# result <- advanced_credit_scoring(sales_reg, credit_notes, reciepts)
# credit_report <- generate_credit_report(result)
# View(credit_report)

# Visualization function (requires ggplot2)
visualize_credit_scores <- function(credit_summary) {
  library(ggplot2)
  
  # Score Distribution
  score_distribution <- ggplot(credit_summary, aes(x = credit_score)) +
    geom_histogram(binwidth = 50, fill = "steelblue", color = "black") +
    labs(
      title = "Distribution of Credit Scores",
      x = "Credit Score",
      y = "Number of Customers"
    ) +
    theme_minimal()
  
  # Risk Category Breakdown
  risk_breakdown <- credit_summary %>%
    group_by(risk_category) %>%
    summarise(count = n()) %>%
    ggplot(aes(x = risk_category, y = count, fill = risk_category)) +
    geom_bar(stat = "identity") +
    labs(
      title = "Risk Category Distribution",
      x = "Risk Category",
      y = "Number of Customers"
    ) +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
  
  return(list(
    score_distribution = score_distribution,
    risk_category_breakdown = risk_breakdown
  ))
}

# Export functions
export_credit_summary <- function(credit_scoring_result, output_dir = ".") {
  # Export comprehensive credit summary
  write.csv(
    credit_scoring_result$payment_summary, 
    file.path(output_dir, "comprehensive_credit_summary.csv"), 
    row.names = FALSE
  )
  
  # Export credit report
  write.csv(
    generate_credit_report(credit_scoring_result), 
    file.path(output_dir, "credit_report.csv"), 
    row.names = FALSE
  )
}



# Run the advanced credit scoring
result <- advanced_credit_scoring(sales_reg, credit_notes, reciepts)

# View the comprehensive credit summary
View(result$payment_summary)

# Generate and view credit report
credit_report <- generate_credit_report(result)
View(credit_report)

# Create visualizations
library(ggplot2)
viz_results <- visualize_credit_scores(result$payment_summary)
print(viz_results$score_distribution)
print(viz_results$risk_category_breakdown)


