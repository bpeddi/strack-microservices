import streamlit as st
import pandas as pd
import requests
from io import BytesIO
import json
from datetime import datetime

# Configuration
AUTH_API_URL = "http://localhost:8080/api/auth/login"  # Your auth service endpoint
TRADE_API_URL = "http://localhost:8081/api/trades/batch"  # Your trade service endpoint

# Session state management
if 'jwt_token' not in st.session_state:
    st.session_state.jwt_token = None
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False



def download_template():
    # Create empty DataFrame with required columns
    df = pd.DataFrame(columns=[
        'symbol', 'quantity', 'price', 'tradeDate',
        'commission', 'action', 'netAmount'
    ])
    
    # Create in-memory Excel file
    output = BytesIO()
    
    # Method 1: Using ExcelWriter (recommended)
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Trades')
    
    # Method 2: Alternative direct approach
    # df.to_excel(output, index=False, engine='openpyxl')  # Also works
    
    # Set pointer to start of the stream
    output.seek(0)
    
    # Create download button
    st.download_button(
        label="📥 Download Excel Template",
        data=output,
        file_name="trade_import_template.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# Login Form
def login_form():
    with st.form("Login"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submit_button = st.form_submit_button("Login")
# {
#   "username": "sree123",
#   "password": "sree123",
#    "roles": ["ROLE_USER"]
# }

        if submit_button:
            try:
                response = requests.post(
                    AUTH_API_URL,
                    json={"email": email, "password": password,"roles": ["ROLE_USER"]},
                    headers={"User-Agent" : "vscode-restclient" , "Content-Type": "application/json"}
                )


                # Print status code and headers first
                print(f"Status Code: {response.status_code}")
                print("Headers:")
                for header, value in response.headers.items():
                    print(f"  {header}: {value}")
                
                print(response.json())
                # Print formatted JSON body
                print("\nResponse Body:")
                print(json.dumps(response.json(), indent=2))

                if response.status_code == 200:
                    st.success("Login successful!")
                    st.session_state.jwt_token = response.json().get('token')
                    st.session_state.logged_in = True
                    st.success("Login successful!")
                    st.rerun()
                else:
                    st.error(f"Login failed: {response.text}")
            except requests.exceptions.RequestException as e:
                st.error(f"Connection error: {str(e)}")

# Trade Import Functionality
def trade_import():
    st.title("📈 Trade Import Tool")
    
    # Step 1: File Upload
    uploaded_file = st.file_uploader("Upload Excel File with Trades", type=["xlsx", "xls"])
    
    if uploaded_file is not None:
        try:
            # Read Excel file
            df = pd.read_excel(uploaded_file)
            
            # Display preview
            st.subheader("Preview of Uploaded Trades")
            st.dataframe(df.head())
            
            # Check required columns
            required_columns = {'symbol', 'quantity', 'price', 'tradeDate', 'commission', 'action', 'netAmount'}
            if not required_columns.issubset(df.columns):
                missing = required_columns - set(df.columns)
                st.error(f"Missing required columns: {', '.join(missing)}")
            else:
                # Convert DataFrame to API-ready format
                trades = df.to_dict('records')
                
                # Convert tradeDate to string if it's datetime
                for trade in trades:
                    if isinstance(trade['tradeDate'], datetime):
                        trade['tradeDate'] = trade['tradeDate'].isoformat()
                    elif isinstance(trade['tradeDate'], pd.Timestamp):
                        trade['tradeDate'] = trade['tradeDate'].to_pydatetime().isoformat()
                
                # Step 2: Send to API
                if st.button("Import Trades"):
                    headers = {
                        "Authorization": f"Bearer {st.session_state.jwt_token}",
                        "Content-Type": "application/json"
                    }
                    
                    with st.spinner("Sending trades to API..."):
                        try:
                            response = requests.post(
                                TRADE_API_URL,
                                data=json.dumps(trades),
                                headers=headers
                            )
                            
                            if response.status_code == 200:
                                st.success(f"Successfully imported {len(trades)} trades!")
                                st.json(response.json())
                            else:
                                st.error(f"Error {response.status_code}: {response.text}")
                        except requests.exceptions.RequestException as e:
                            st.error(f"Failed to connect to API: {str(e)}")
        
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

    # Download template
    st.markdown("### Need a template?")
    download_template()
    

# Logout Button
def logout():
    st.session_state.jwt_token = None
    st.session_state.logged_in = False
    st.success("Logged out successfully!")
    st.rerun()

# Main App Logic
def main():
    if not st.session_state.logged_in:
        st.title("🔒 Login to Trade Importer")
        login_form()
    else:
        trade_import()
        if st.button("Logout"):
            logout()

if __name__ == "__main__":
    main()