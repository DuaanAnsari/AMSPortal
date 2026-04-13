import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import { memo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog, { dialogClasses } from '@mui/material/Dialog';

import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useEventListener } from 'src/hooks/use-event-listener';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import SearchNotFound from 'src/components/search-not-found';

import POSearchEngine from 'src/sections/Supply-Chain/view/Quick-Search';

import ResultItem from './result-item';
import { useNavData } from '../../dashboard/config-navigation';
import { applyFilter, groupedData, getAllItems } from './utils';

// ----------------------------------------------------------------------

function Searchbar() {
  const theme = useTheme();

  const router = useRouter();

  const search = useBoolean();

  const lgUp = useResponsive('up', 'lg');

  const [searchQuery, setSearchQuery] = useState('');

  const [searchMode, setSearchMode] = useState('nav'); // 'nav' | 'po'

  const navData = useNavData();

  const handleClose = useCallback(() => {
    search.onFalse();
    setSearchQuery('');
    setSearchMode('nav');
  }, [search]);

  const handleKeyDown = (event) => {
    if (event.key === 'k' && event.metaKey) {
      search.onToggle();
      setSearchQuery('');
      setSearchMode('nav');
    }
  };

  useEventListener('keydown', handleKeyDown);

  const handleClick = useCallback(
    (path) => {
      if (path.includes('http')) {
        window.open(path);
      } else {
        router.push(path);
      }
      handleClose();
    },
    [handleClose, router]
  );

  const handleSearch = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const dataFiltered = applyFilter({
    inputData: getAllItems({ data: navData }),
    query: searchQuery,
  });

  const notFound = searchQuery && !dataFiltered.length;

  const renderItems = () => {
    const data = groupedData(dataFiltered);

    return Object.keys(data)
      .sort((a, b) => -b.localeCompare(a))
      .map((group, index) => (
        <List key={group || index} disablePadding>
          {data[group].map((item) => {
            const { title, path } = item;

            const partsTitle = parse(title, match(title, searchQuery));

            const partsPath = parse(path, match(path, searchQuery));

            return (
              <ResultItem
                path={partsPath}
                title={partsTitle}
                key={`${title}${path}`}
                groupLabel={searchQuery && group}
                onClickItem={() => handleClick(path)}
              />
            );
          })}
        </List>
      ));
  };

  const renderButton = (
    <Stack direction="row" alignItems="center">
      <IconButton onClick={search.onTrue}>
        <Iconify icon="eva:search-fill" />
      </IconButton>

      {lgUp && <Label sx={{ px: 0.75, fontSize: 12, color: 'text.secondary' }}>⌘K</Label>}
    </Stack>
  );

  return (
    <>
      {renderButton}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={search.value}
        onClose={handleClose}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: 0,
        }}
        PaperProps={{
          sx: {
            overflow: 'hidden',
          },
        }}
        sx={{
          [`& .${dialogClasses.container}`]: {
            alignItems: 'center',
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: `solid 1px ${theme.palette.divider}` }}>
          <InputBase
            fullWidth
            autoFocus={searchMode !== 'po'}
            placeholder={searchMode === 'po' ? "Search Purchase Orders..." : "Search..."}
            value={searchQuery}
            onChange={handleSearch}
            startAdornment={
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={24} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            }
            endAdornment={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setSearchMode(searchMode === 'nav' ? 'po' : 'nav')}
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    px: 2.5,
                    py: 0.75,
                    minWidth: 90,
                    borderRadius: 1,
                    whiteSpace: 'nowrap',
                    background: searchMode === 'po'
                      ? 'linear-gradient(135deg, #FF4842 0%, #FF1744 100%)' // Reddish for Back
                      : 'linear-gradient(135deg, #1877F2 0%, #006097 100%)', // Blueish for PO Search
                    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.15)',
                    '&:hover': {
                      background: searchMode === 'po'
                        ? 'linear-gradient(135deg, #DE3B35 0%, #D32F2F 100%)'
                        : 'linear-gradient(135deg, #1C6CDC 0%, #0B48A0 100%)',
                    }
                  }}
                >
                  {searchMode === 'po' ? 'Back' : 'PO Search'}
                </Button>
                <Label sx={{ letterSpacing: 1, color: 'text.secondary' }}>esc</Label>
              </Stack>
            }
            inputProps={{
              sx: { typography: 'h6' },
            }}
          />
        </Box>

        {searchMode === 'po' ? (
          <Box
            sx={{
              p: 0,
              height: '60vh',
              overflow: 'auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            }}
          >
            <POSearchEngine isDialog onClose={handleClose} />
          </Box>
        ) : (
          <Scrollbar sx={{ p: 3, pt: 2, height: 400 }}>
            {notFound ? <SearchNotFound query={searchQuery} sx={{ py: 10 }} /> : renderItems()}
          </Scrollbar>
        )}
      </Dialog>
    </>
  );
}

export default memo(Searchbar);
