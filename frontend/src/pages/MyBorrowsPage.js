import React, { useState, useEffect, useCallback } from 'react';
// Import API functions
import { getMyBorrows, createBorrowSlip, submitBorrowSlip, deleteBorrowSlip } from '../services/api';
// Import Auth context hook
import { useAuth } from '../contexts/AuthContext';
// Import Link for navigation
import { Link } from 'react-router-dom'; // <<< Import Link

function MyBorrowsPage({ borrowSelection = [], onRemoveBook = () => {}, onClearSelection = () => {} }) {
  // State for the list of existing borrowing slips
  const [slips, setSlips] = useState([]);
  // State for loading the initial list of slips
  const [loading, setLoading] = useState(true);
  // State for general errors (fetch slips, delete/submit existing slip)
  const [error, setError] = useState('');
  // State for tracking which specific slip action is in progress (delete/submit)
  const [actionLoading, setActionLoading] = useState(null); // Stores the ID of the slip being processed
  // State for loading when creating a new slip from selection
  const [createSlipLoading, setCreateSlipLoading] = useState(false);
  // State for errors specific to creating a slip from selection
  const [createSlipError, setCreateSlipError] = useState('');
  // Get the logout function from auth context
  const { logout } = useAuth();

  // --- Function to Fetch Existing Borrowing Slips ---
  const fetchBorrows = useCallback(async (showLoading = false) => {
    // Optionally show loading indicator if called after an action (not initial load)
    if (showLoading) setLoading(true);
    setError(''); // Clear previous general errors
    console.log("MyBorrowsPage: Fetching existing slips...");
    try {
      const response = await getMyBorrows();
      setSlips(response.data || []); // Ensure slips is always an array
      console.log("MyBorrowsPage: Slips fetched successfully.", response.data?.length || 0);
    } catch (err) {
      console.error("MyBorrowsPage: Failed to fetch borrowing slips:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Your session may have expired or you have insufficient permissions. Please log in again.');
        // Consider automatically logging out or redirecting
        // setTimeout(logout, 3000);
      } else {
        setError('Failed to load your borrowing slips. Please try refreshing the page.');
      }
    } finally {
      // Only set loading to false on initial load or if explicitly requested
       setLoading(false);
    }
  }, [logout]); // logout is a dependency for the error handling part

// --- Effect to Fetch Slips on Initial Mount ---
useEffect(() => {
  fetchBorrows(true); // Fetch data and show loading on initial mount
}, [fetchBorrows]); // <<< Thêm fetchBorrows vào đây

  // --- Function to Create a New Slip from Current Selection ---
  const handleCreateSlipFromSelection = async () => {
    // Prevent creation if selection is empty
    if (!Array.isArray(borrowSelection) || borrowSelection.length === 0) {
      alert("Your selection is empty. Please select some books from the 'Books' page first.");
      return;
    }

    setCreateSlipLoading(true); // Start loading indicator for this action
    setCreateSlipError('');     // Clear previous creation errors
    setError('');               // Clear general page errors

    try {
      // Extract book IDs from the selection
      const bookIds = borrowSelection.map(item => item.id);
      console.log("MyBorrowsPage: Creating slip with selected book IDs:", bookIds);

      // Call the API to create the slip, passing the book IDs
      // Assumes the backend endpoint '/api/borrow/slips' accepts { bookIds: [...] } in the POST body
      const response = await createBorrowSlip({ bookIds });
      const newSlipId = response?.data?.slipId; // Get the new slip ID from response if available

      alert(`Borrowing slip${newSlipId ? ` (ID: ${newSlipId})` : ''} created successfully with ${borrowSelection.length} book(s)! It's now in 'draft' status.`);

      onClearSelection(); // Call the function passed from App.js to clear the selection state
      await fetchBorrows(true); // Reload the list of slips to show the new one (show loading)

    } catch (err) {
      console.error("MyBorrowsPage: Failed to create slip from selection:", err);
      // Display specific error from API or a generic one
      setCreateSlipError(err.response?.data?.message || 'Failed to create the borrowing slip. Please check the books or try again.');
    } finally {
      setCreateSlipLoading(false); // Stop the loading indicator for this action
    }
  };

  // --- Function to Submit an Existing Draft Slip ---
  const handleSubmitSlip = async (slipId) => {
    setActionLoading(slipId); // Indicate loading for this specific slip
    setError(''); // Clear general errors

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to submit Slip ID ${slipId}? The availability of books will be checked.`)) {
      setActionLoading(null); // Cancel loading if user cancels
      return;
    }

    try {
      await submitBorrowSlip(slipId); // Call the API
      alert(`Slip ID ${slipId} submitted successfully!`);
      await fetchBorrows(true); // Reload the list to reflect status change (show loading)
    } catch (err) {
      console.error(`MyBorrowsPage: Failed to submit slip ID ${slipId}:`, err);
      // Display specific error from API or a generic one
      setError(err.response?.data?.message || `Failed to submit Slip ID ${slipId}. It might be out of stock or an error occurred.`);
    } finally {
      setActionLoading(null); // Stop loading for this specific slip
    }
  };

  // --- Function to Delete an Existing Draft Slip ---
  const handleDeleteSlip = async (slipId) => {
    setActionLoading(slipId); // Indicate loading for this specific slip
    setError(''); // Clear general errors

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete Draft Slip ID ${slipId}? This action cannot be undone.`)) {
      setActionLoading(null); // Cancel loading if user cancels
      return;
    }

    try {
      await deleteBorrowSlip(slipId); // Call the API
      alert(`Draft Slip ID ${slipId} deleted successfully!`);
      await fetchBorrows(true); // Reload the list (show loading)
    } catch (err) {
      console.error(`MyBorrowsPage: Failed to delete draft slip ID ${slipId}:`, err);
      // Display specific error from API or a generic one
      setError(err.response?.data?.message || `Failed to delete Draft Slip ID ${slipId}. Please try again.`);
    } finally {
      setActionLoading(null); // Stop loading for this specific slip
    }
  };


  // --- UI Rendering ---
  return (
    <div className="container">
      <h2>My Borrowing Area</h2>

      {/* --- Section for Current Book Selection --- */}
      <div className="borrow-selection-box">
        <h3>Your Current Book Selection</h3>
        {/* Display error specific to creating slip from selection */}
        {createSlipError && <p className="error-message">{createSlipError}</p>}

        {/* Check if selection array exists and has items */}
        {!Array.isArray(borrowSelection) || borrowSelection.length === 0 ? (
          <p>
            You haven't selected any books yet. Visit the <Link to="/books">Books page</Link> to add items.
          </p>
        ) : (
          <>
            {/* List of selected books */}
            <ul className="selection-list">
              {borrowSelection.map(item => (
                <li key={item.id} className="selection-item">
                  <span>{item.title} (ID: {item.id})</span>
                  {/* Button to remove a book from selection */}
                  <button
                    onClick={() => {
                        console.log(`MyBorrowsPage: Removing book ID ${item.id} from selection.`);
                        onRemoveBook(item.id); // Call function from props
                    }}
                    className="danger remove-button"
                    disabled={createSlipLoading} // Disable while creating slip
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {/* Actions for the current selection */}
            <div className="selection-actions">
              <button
                onClick={handleCreateSlipFromSelection}
                disabled={createSlipLoading || borrowSelection.length === 0} // Disable if loading or empty
              >
                {createSlipLoading ? 'Creating Slip...' : `Create Draft Slip (${borrowSelection.length} items)`}
              </button>
              <button
                onClick={() => {
                    console.log("MyBorrowsPage: Clearing selection.");
                    onClearSelection(); // Call function from props
                }}
                className="secondary"
                style={{ marginLeft: '10px' }}
                disabled={createSlipLoading || borrowSelection.length === 0} // Disable if loading or empty
              >
                Clear Selection
              </button>
            </div>
          </>
        )}
      </div>
      {/* ------------------------------------ */}


      {/* --- Section for Existing Borrowing Slips --- */}
      <h3>My Existing Borrowing Slips</h3>
      {/* Display general page errors (fetch, delete, submit) */}
      {error && <p className="error-message">{error}</p>}

      {/* Show loading indicator while fetching slips */}
      {loading ? (
        <div className="loading">Loading your borrowing slips...</div>
      ) : !Array.isArray(slips) || slips.length === 0 ? (
        // Show message if no slips are found
        <p>You have no borrowing slips recorded yet.</p>
      ) : (
        // Render the list of slips
        <ul className="slips-list">
          {slips.map((slip) => (
            <li key={slip.id} className="slip-item">
              {/* Information about the slip */}
              <div className="slip-info">
                Slip ID: {slip.id} - Status: <strong className={`status-${slip.status}`}>{slip.status}</strong>
                <br/>
                <small>
                  Created: {new Date(slip.created_at).toLocaleString()} |
                  Items: {slip.item_count}
                  {slip.submitted_at && ` | Submitted: ${new Date(slip.submitted_at).toLocaleString()}`}
                  {/* Add other dates as needed */}
                </small>
              </div>
              {/* Actions available for the slip */}
              <div className="slip-actions">
                {/* Actions only for slips in 'draft' status */}
                {slip.status === 'draft' && (
                  <>
                    {/* Submit Button */}
                    <button
                      onClick={() => handleSubmitSlip(slip.id)}
                      // Disable if another action is loading OR this slip is loading OR it's empty
                      disabled={actionLoading === slip.id || !!actionLoading || slip.item_count === 0}
                      title={slip.item_count === 0 ? "Cannot submit an empty slip" : "Submit this slip for approval"}
                    >
                      {/* Show loading text if this slip is being processed */}
                      {actionLoading === slip.id ? 'Processing...' : 'Submit'}
                    </button>
                    {/* Delete Button */}
                    <button
                      className="danger"
                      onClick={() => handleDeleteSlip(slip.id)}
                      // Disable if another action is loading OR this slip is loading
                      disabled={actionLoading === slip.id || !!actionLoading}
                    >
                      {actionLoading === slip.id ? 'Processing...' : 'Delete Draft'}
                    </button>
                  </>
                )}
                 {/* TODO: Add "View Details" button for other statuses if needed */}
                 {/* {slip.status !== 'draft' && (
                     <button className="secondary">View Details</button>
                 )} */}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* CSS (using regular classes now, ensure they are in index.css or a module) */}
      <style jsx>{`
        .borrow-selection-box {
          border: 1px dashed #ccc;
          padding: 15px;
          margin-bottom: 30px;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        .selection-list {
          max-height: 200px; /* Allow more space */
          overflow-y: auto;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .selection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 5px; /* More padding */
          margin-bottom: 5px; /* Space between items */
          background: none;
          border: none; /* Remove default li border */
          border-bottom: 1px solid #eee; /* Add separator */
        }
        .selection-item:last-child {
            border-bottom: none; /* Remove border for last item */
        }
        .remove-button {
          padding: 3px 8px;
          font-size: 0.85em;
        }
        .selection-actions button {
          margin-top: 10px; /* Space above buttons */
        }
        .slips-list {
            margin-top: 15px;
        }
        .slip-item { /* Styles for the main slip list items */
             border: 1px solid #ddd;
        }
        .slip-actions button {
          margin-left: 5px;
        }
        /* Add styles for different statuses */
        .status-draft { color: #6c757d; }
        .status-submitted { color: #007bff; }
        .status-approved { color: #ffc107; } /* Example */
        .status-borrowed { color: #28a745; }
        .status-returned { color: #17a2b8; }
        .status-rejected { color: #dc3545; }
        .status-overdue { color: #dc3545; font-weight: bold; }

      `}</style>

    </div>
  );
}

export default MyBorrowsPage;